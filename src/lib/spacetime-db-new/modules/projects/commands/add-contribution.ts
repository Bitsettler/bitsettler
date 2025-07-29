import { supabase, isSupabaseAvailable, handleSupabaseError } from '../../../shared/supabase-client';
import { MemberContribution } from './get-project-by-id';

export interface AddContributionRequest {
  // NextAuth user data
  authUser: {
    id: string;           // NextAuth user.id
    name: string;         // NextAuth user.name  
    email?: string;       // NextAuth user.email
    image?: string;       // NextAuth user.image
  };
  projectId: string;
  projectItemId?: string;
  contributionType: 'Item' | 'Crafting' | 'Gathering' | 'Other';
  itemName?: string;
  quantity: number;
  description?: string;
}

/**
 * Find or create settlement member for NextAuth user
 * This links authenticated users to settlement member records
 */
async function ensureSettlementMember(authUser: {
  id: string;
  name: string;
  email?: string;
  image?: string;
}): Promise<string> {
  
  // First, check if this auth user already has a linked settlement member
  const { data: existingMember } = await supabase!
    .from('settlement_members')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .single();

  if (existingMember) {
    console.log('✅ Found existing settlement member for auth user:', existingMember.id);
    return existingMember.id;
  }

  // Look for existing member by name (for migration from localStorage users)
  const { data: memberByName } = await supabase!
    .from('settlement_members')
    .select('id, auth_user_id')
    .eq('name', authUser.name)
    .is('auth_user_id', null) // Only unlinked members
    .single();

  if (memberByName) {
    // Link existing member to this auth user
    const { error: linkError } = await supabase!
      .from('settlement_members')
      .update({ auth_user_id: authUser.id })
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
  const { data: newMember, error: createError } = await supabase!
    .from('settlement_members')
    .insert({
      auth_user_id: authUser.id,
      name: authUser.name,
      profession: 'Contributor', // Default profession
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
 * Add a new member contribution to a project (NextAuth version)
 */
export async function addContribution(contributionData: AddContributionRequest): Promise<MemberContribution> {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase not available');
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
      project_item_id: contributionData.projectItemId,
      contribution_type: contributionData.contributionType,
      item_name: contributionData.itemName || null,
      quantity: contributionData.quantity,
      description: contributionData.description || null,
    };

    console.log('🔍 Final insert data:', insertData);

    const { data: contribution, error: contributionError } = await supabase!
      .from('member_contributions')
      .insert(insertData)
      .select(`
        id,
        member_id,
        contribution_type,
        item_name,
        quantity,
        description,
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

    return {
      id: contribution.id,
      memberId: contribution.member_id,
      memberName: contributionData.authUser.name, // Use the auth user's name
      contributionType: contribution.contribution_type,
      itemName: contribution.item_name,
      quantity: contribution.quantity,
      description: contribution.description,
      contributedAt: new Date(contribution.contributed_at),
    };

  } catch (error) {
    console.error('Error adding contribution:', error);
    throw error;
  }
}

/**
 * Update project item quantity when a contribution is made
 */
export async function updateProjectItemQuantity(
  projectItemId: string, 
  quantityToAdd: number
): Promise<void> {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase not available');
  }

  try {
    // Get current quantity
    const { data: currentItem, error: fetchError } = await supabase!
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
    const { error: updateError } = await supabase!
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