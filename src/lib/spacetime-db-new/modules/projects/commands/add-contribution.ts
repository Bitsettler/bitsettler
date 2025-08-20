import { createServerClient, handleSupabaseError } from '../../../shared/supabase-client';
import { logProjectContribution } from '../../../../settlement/project-activity-tracker';
import type { MemberContribution } from '../types/member-contributions';

export interface AddContributionRequest {
  memberId: string; // Settlement member ID (not auth user ID)
  memberName: string; // Settlement member name (like "PR3SIDENT")
  projectId: string;
  projectItemId?: string;
  deliveryMethod: 'Dropbox' | 'Officer Handoff' | 'Added to Building' | 'Other';
  itemName?: string;
  quantity: number;
  description?: string;
}

// Settlement member ID is now passed directly from the API - no complex linking needed

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
    // Use the member ID directly (no complex linking needed)
    const memberId = contributionData.memberId;
    console.log('🔗 Using settlement member:', memberId, 'for character:', contributionData.memberName);

    // Insert the contribution
    console.log('🔄 Attempting to insert contribution:', {
      member_id: memberId,
      project_id: contributionData.projectId,
      project_item_id: contributionData.projectItemId,
      item_name: contributionData.itemName,
      quantity: contributionData.quantity,
      description: contributionData.description
    });

    const insertData = {
      member_id: memberId,
      project_id: contributionData.projectId,
      // No project_item_id column - contributions link via project_id + item_name
      delivery_method: contributionData.deliveryMethod,
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
        delivery_method,
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
          contributionData.memberId,
          contributionData.memberName,
          contribution.item_name || 'Unknown Item',
          contribution.quantity,
          contribution.notes || undefined,
          contribution.delivery_method || undefined
        );
      }
    } catch (activityError) {
      console.warn('Failed to log project contribution activity:', activityError);
      // Don't fail the contribution if activity logging fails
    }

    return {
      id: contribution.id,
      memberId: contribution.member_id,
      memberName: contributionData.memberName, // Use the settlement character's name (like "PR3SIDENT")
      deliveryMethod: contribution.delivery_method,
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