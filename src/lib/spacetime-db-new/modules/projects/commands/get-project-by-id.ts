import { createServerClient, handleSupabaseError } from '../../../shared/supabase-client';
import { ProjectWithItems, ProjectItem } from './get-all-projects';

export interface MemberContribution {
  id: string;
  memberId: string;
  memberName: string;
  deliveryMethod: 'Dropbox' | 'Officer Handoff' | 'Added to Building' | 'Other';
  itemName: string | null;
  quantity: number;
  description: string | null;
  contributedAt: Date;
}

export interface ProjectDetails extends ProjectWithItems {
  contributions: MemberContribution[];
  assignedMembers: Array<{
    id: string;
    name: string;
    role: string;
    assignedAt: Date;
  }>;
  totalContributions: number;
  contributingMembers: number;
}

/**
 * Get project by ID with full details including contributions and assignments
 */
export async function getProjectById(projectId: string): Promise<ProjectDetails | null> {
  // Use service role client to bypass RLS for project queries
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning null');
    return null;
  }

  try {
    // Get project details
    const { data: projectData, error: projectError } = await supabase
      .from('settlement_projects')
      .select(`
        *,
        owner:settlement_members!created_by_member_id(
          id,
          name
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return null; // Project not found
      }
      throw handleSupabaseError(projectError, 'getting project by ID');
    }

    if (!projectData) {
      return null;
    }

    // Get project items
    const { data: itemsData, error: itemsError } = await supabase
      .from('project_items')
      .select('*')
      .eq('project_id', projectId)
      .order('rank_order')
      .order('priority', { ascending: false });

    if (itemsError) {
      throw handleSupabaseError(itemsError, 'getting project items');
    }

    // Get project contributions (simplified query without join)
    const { data: contributionsData, error: contributionsError } = await supabase
      .from('member_contributions')
      .select('*')
      .eq('project_id', projectId)
      .order('contributed_at', { ascending: false });

    // Don't throw error if no contributions found, just log and continue
    if (contributionsError && contributionsError.code !== 'PGRST116') {
      console.warn('Error fetching contributions:', contributionsError);
    }

    // Get member names separately
    const memberIds = contributionsData?.map(c => c.member_id) || [];
    let membersData: any[] = [];
    
    if (memberIds.length > 0) {
      const { data: members } = await supabase
        .from('settlement_members')
        .select('id, name')
        .in('id', memberIds);
      membersData = members || [];
    }

    // Get assigned members (allow empty results)
    const { data: assignedData, error: assignedError } = await supabase
      .from('project_members')
      .select(`
        id,
        role,
        assigned_at,
        settlement_members(id, name)
      `)
      .eq('project_id', projectId)
      .order('assigned_at');

    // Don't throw error if no assignments found, just log and continue
    if (assignedError && assignedError.code !== 'PGRST116') {
      console.warn('Error fetching assigned members:', assignedError);
    }

    // Process the data
    const items: ProjectItem[] = (itemsData || []).map(item => ({
      id: item.id,
      project_id: item.project_id,
      item_name: item.item_name,
      required_quantity: item.required_quantity,
      contributed_quantity: item.current_quantity,
      tier: item.tier,
      priority: item.priority,
      rank_order: item.rank_order,
      status: item.status,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    const contributions: MemberContribution[] = (contributionsData || []).map(contrib => {
      const member = membersData.find(m => m.id === contrib.member_id);
      return {
        id: contrib.id,
        memberId: contrib.member_id,
        memberName: member?.name || 'Unknown Member',
        deliveryMethod: contrib.delivery_method,
        itemName: contrib.item_name,
        quantity: contrib.quantity,
        description: contrib.notes, // Map notes column to description interface field
        contributedAt: new Date(contrib.contributed_at),
      };
    });

    const assignedMembers = (assignedData || []).map(assigned => ({
      id: assigned.settlement_members?.id || assigned.id,
      name: assigned.settlement_members?.name || 'Unknown Member',
      role: assigned.role,
      assignedAt: new Date(assigned.assigned_at),
    }));

    // Calculate completion statistics
    const completedItems = items.filter(item => item.status === 'Completed').length;
    const totalItems = items.length;
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Calculate contribution statistics
    const totalContributions = contributions.length;
    const contributingMembers = new Set(contributions.map(c => c.memberId)).size;

    return {
      id: projectData.id,
      project_number: projectData.project_number,
      short_id: projectData.short_id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      priority: projectData.priority,
      createdBy: projectData.created_by,
      ownerName: projectData.owner?.name || null,
      createdAt: new Date(projectData.created_at),
      updatedAt: new Date(projectData.updated_at),
      items,
      completionPercentage,
      totalItems,
      completedItems,
      contributions,
      assignedMembers,
      totalContributions,
      contributingMembers,
    };

  } catch (error) {
    console.error('Error fetching project by ID:', error);
    throw error;
  }
} 