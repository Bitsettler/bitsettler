import { createServerClient, handleSupabaseError } from '../../../shared/supabase-client';
import { MemberContribution } from './get-project-by-id';
import { logProjectContribution } from '../../../../settlement/project-activity-tracker';

export interface AddContributionRequest {
  // Authenticated user data
  authUser: {
    id: string;           // Supabase user.id
    name: string;         // User display name  
    email?: string;       // User email
    image?: string;       // User avatar
  };
  projectId: string;
  projectItemId?: string;
  contributionType: 'Direct' | 'Crafted' | 'Purchased';
  itemName?: string;
  quantity: number;
  description?: string;
}

/**
 * Find or create settlement member for authenticated user
 * This links authenticated users to settlement member records
 */
async function ensureSettlementMember(authUser: {
  id: string;
  name: string;
  email?: string;
  image?: string;
}): Promise<string> {
  
  // Use service role client to bypass RLS
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Supabase service role client not available');
  }

  // First, check if this auth user already has a linked settlement member
  const { data: existingMember } = await supabase
    .from('settlement_members')
    .select('id')
    .eq('supabase_user_id', authUser.id)
    .single();

  if (existingMember) {
    console.log('✅ Found existing settlement member for auth user:', existingMember.id);
    return existingMember.id;
  }

  // Look for existing member by name (for migration from localStorage users)
  const { data: memberByName } = await supabase
    .from('settlement_members')
    .select('id, supabase_user_id')
    .eq('name', authUser.name)
    .is('supabase_user_id', null) // Only unlinked members
    .single();

  if (memberByName) {
    // Link existing member to this auth user
    const { error: linkError } = await supabase
      .from('settlement_members')
      .update({ supabase_user_id: authUser.id })
      .eq('id', memberByName.id);

    if (linkError) {
      console.error('🔴 Failed to link existing member:', linkError);
    } else {
      console.log('🔗 Linked existing member to auth user:', memberByName.id);
      return memberByName.id;
    }
  }

  // Create new settlement member for this auth user
  console.log('🆕 Creating new settlement member for auth user:', authUser.name);
  const { data: newMember, error: createError } = await supabase
    .from('settlement_members')
    .insert({
      supabase_user_id: authUser.id,
      name: authUser.name,
      top_profession: 'Contributor', // Default profession
    })
    .select('id')
    .single();

  if (createError) {
    console.error('🔴 MEMBER CREATION FAILED:', createError);
    throw new Error(`Failed to create settlement member: ${createError.message}`);
  }

  console.log('✅ Created settlement member:', newMember.id);
  return newMember.id;
}

/**
 * Add a new member contribution to a project
 */
export async function addContribution(contributionData: AddContributionRequest): Promise<MemberContribution> {
  // Use service role client to bypass RLS for contribution operations
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Supabase service role client not available for contributions');
  }

  try {
    // Ensure settlement member exists for this auth user
    const memberId = await ensureSettlementMember(contributionData.authUser);
    console.log('🔗 Using settlement member:', memberId, 'for auth user:', contributionData.authUser.name);

    // Insert the contribution
    console.log('🔄 Attempting to insert contribution:', {
      member_id: memberId,
      project_id: contributionData.projectId,
      project_item_id: contributionData.projectItemId,
      contribution_type: contributionData.contributionType,
      item_name: contributionData.itemName,
      quantity: contributionData.quantity,
      description: contributionData.description
    });

    const insertData = {
      member_id: memberId,
      project_id: contributionData.projectId,
      // No project_item_id column - contributions link via project_id + item_name
      contribution_type: contributionData.contributionType,
      item_name: contributionData.itemName || null,
      quantity: contributionData.quantity,
      notes: contributionData.description || null, // Map description to notes column
    };

    console.log('🔍 Final insert data:', insertData);

    const { data: contribution, error: contributionError } = await supabase
      .from('member_contributions')
      .insert(insertData)
      .select(`
        id,
        member_id,
        contribution_type,
        item_name,
        quantity,
        notes,
        contributed_at
      `)
      .single();

    if (contributionError) {
      console.error('🔴 CONTRIBUTION INSERT FAILED:', {
        error: contributionError,
        errorCode: contributionError.code,
        errorMessage: contributionError.message,
        errorDetails: contributionError.details,
        errorHint: contributionError.hint,
        insertData
      });
      
      // Show the actual Supabase error instead of generic message
      throw new Error(`Supabase Error [${contributionError.code}]: ${contributionError.message}. Details: ${contributionError.details || 'None'}. Hint: ${contributionError.hint || 'None'}`);
    }

    console.log('✅ Contribution inserted successfully:', contribution.id);

    // Get project details for activity logging
    try {
      const { data: project, error: projectError } = await supabase
        .from('settlement_projects')
        .select('name, priority')
        .eq('id', contributionData.projectId)
        .single();

      if (!projectError && project) {
        await logProjectContribution(
          contributionData.projectId,
          project.name,
          project.priority,
          contributionData.authUser.id,
          contributionData.authUser.name,
          contribution.item_name || 'Unknown Item',
          contribution.quantity,
          contribution.notes || undefined
        );
      }
    } catch (activityError) {
      console.warn('Failed to log project contribution activity:', activityError);
      // Don't fail the contribution if activity logging fails
    }

    return {
      id: contribution.id,
      memberId: contribution.member_id,
      memberName: contributionData.authUser.name, // Use the auth user's name
      contributionType: contribution.contribution_type,
      itemName: contribution.item_name,
      quantity: contribution.quantity,
      description: contribution.notes, // Map notes back to description for interface consistency
      contributedAt: new Date(contribution.contributed_at),
    };

  } catch (error) {
    console.error('Error adding contribution:', error);
    throw error;
  }
}

/**
 * Update project item quantity when a contribution is made
 * Finds project item by project_id + item_name since contributions don't store project_item_id
 */
export async function updateProjectItemQuantityByName(
  projectId: string,
  itemName: string, 
  quantityToAdd: number
): Promise<void> {
  // Use service role client to bypass RLS for quantity updates
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Supabase service role client not available for quantity updates');
  }

  try {
    // Find project item by project_id + item_name
    const { data: currentItem, error: fetchError } = await supabase
      .from('project_items')
      .select('id, current_quantity, required_quantity')
      .eq('project_id', projectId)
      .eq('item_name', itemName)
      .single();

    if (fetchError) {
      // If no matching project item found, this might be a freeform contribution
      if (fetchError.code === 'PGRST116') {
        console.log(`No project item found for ${itemName} in project ${projectId} - treating as freeform contribution`);
        return;
      }
      throw handleSupabaseError(fetchError, 'fetching current item quantity');
    }

    const newQuantity = (currentItem.current_quantity || 0) + quantityToAdd;
    const newStatus = newQuantity >= currentItem.required_quantity ? 'Completed' : 'In Progress';

    // Update quantity and status
    const { error: updateError } = await supabase
      .from('project_items')
      .update({
        current_quantity: newQuantity,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentItem.id);

    if (updateError) {
      throw handleSupabaseError(updateError, 'updating project item quantity');
    }

    console.log(`✅ Updated ${itemName} quantity: ${currentItem.current_quantity} + ${quantityToAdd} = ${newQuantity}`);

  } catch (error) {
    console.error('Error updating project item quantity:', error);
    throw error;
  }
}

/**
 * Legacy function - kept for backwards compatibility
 * @deprecated Use updateProjectItemQuantityByName instead
 */
export async function updateProjectItemQuantity(
  projectItemId: string, 
  quantityToAdd: number
): Promise<void> {
  // Use service role client to bypass RLS for quantity updates
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Supabase service role client not available for quantity updates');
  }

  try {
    // Get current quantity
    const { data: currentItem, error: fetchError } = await supabase
      .from('project_items')
      .select('current_quantity, required_quantity')
      .eq('id', projectItemId)
      .single();

    if (fetchError) {
      throw handleSupabaseError(fetchError, 'fetching current item quantity');
    }

    const newQuantity = (currentItem.current_quantity || 0) + quantityToAdd;
    const newStatus = newQuantity >= currentItem.required_quantity ? 'Completed' : 'In Progress';

    // Update quantity and status
    const { error: updateError } = await supabase
      .from('project_items')
      .update({
        current_quantity: newQuantity,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectItemId);

    if (updateError) {
      throw handleSupabaseError(updateError, 'updating project item quantity');
    }

  } catch (error) {
    console.error('Error updating project item quantity:', error);
    throw error;
  }
}