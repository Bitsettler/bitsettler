import { supabase, isSupabaseAvailable, handleSupabaseError } from '../../../shared/supabase-client';
import { MemberContribution } from './get-project-by-id';

export interface AddContributionRequest {
  memberId: string;
  projectId: string;
  projectItemId?: string;
  contributionType: 'Item' | 'Crafting' | 'Gathering' | 'Other';
  itemName?: string;
  quantity: number;
  description?: string;
}

/**
 * Add a new member contribution to a project
 */
export async function addContribution(contributionData: AddContributionRequest): Promise<MemberContribution> {
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase not available');
  }

  try {
    // First, ensure the member exists or create them
    let memberId = contributionData.memberId;
    
    // If memberId looks like a name (not UUID), try to find or create the member
    if (!contributionData.memberId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Look for existing member by name
      const { data: existingMember } = await supabase!
        .from('settlement_members')
        .select('id')
        .eq('name', contributionData.memberId)
        .single();

      if (existingMember) {
        memberId = existingMember.id;
      } else {
        // Create new member if not found
        const { data: newMember, error: memberError } = await supabase!
          .from('settlement_members')
          .insert({
            name: contributionData.memberId,
            profession: 'Contributor', // Default profession
          })
          .select('id')
          .single();

        if (memberError) {
          throw handleSupabaseError(memberError, 'creating member');
        }

        memberId = newMember.id;
      }
    }

    // Insert the contribution
    const { data: contribution, error: contributionError } = await supabase!
      .from('member_contributions')
      .insert({
        member_id: memberId,
        project_id: contributionData.projectId,
        project_item_id: contributionData.projectItemId || null,
        contribution_type: contributionData.contributionType,
        item_name: contributionData.itemName || null,
        quantity: contributionData.quantity,
        description: contributionData.description || null,
      })
      .select(`
        id,
        member_id,
        contribution_type,
        item_name,
        quantity,
        description,
        contributed_at,
        settlement_members!inner(name)
      `)
      .single();

    if (contributionError) {
      throw handleSupabaseError(contributionError, 'adding contribution');
    }

    return {
      id: contribution.id,
      memberId: contribution.member_id,
      memberName: (contribution.settlement_members as any).name,
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