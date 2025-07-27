import { supabase, isSupabaseAvailable, handleSupabaseError } from '../../../shared/supabase-client';
import { ProjectWithItems, ProjectItem } from './get-all-projects';

export interface MemberContribution {
  id: string;
  memberId: string;
  memberName: string;
  contributionType: 'Item' | 'Crafting' | 'Gathering' | 'Other';
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
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, returning null');
    return null;
  }

  try {
    // Get project details
    const { data: projectData, error: projectError } = await supabase!
      .from('settlement_projects')
      .select('*')
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
    const { data: itemsData, error: itemsError } = await supabase!
      .from('project_items')
      .select('*')
      .eq('project_id', projectId)
      .order('rank_order')
      .order('priority', { ascending: false });

    if (itemsError) {
      throw handleSupabaseError(itemsError, 'getting project items');
    }

    // Get project contributions with member names
    const { data: contributionsData, error: contributionsError } = await supabase!
      .from('member_contributions')
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
      .eq('project_id', projectId)
      .order('contributed_at', { ascending: false });

    if (contributionsError) {
      throw handleSupabaseError(contributionsError, 'getting project contributions');
    }

    // Get assigned members
    const { data: assignedData, error: assignedError } = await supabase!
      .from('project_members')
      .select(`
        id,
        role,
        assigned_at,
        settlement_members!inner(id, name)
      `)
      .eq('project_id', projectId)
      .order('assigned_at');

    if (assignedError) {
      throw handleSupabaseError(assignedError, 'getting assigned members');
    }

    // Process the data
    const items: ProjectItem[] = (itemsData || []).map(item => ({
      id: item.id,
      projectId: item.project_id,
      itemName: item.item_name,
      requiredQuantity: item.required_quantity,
      currentQuantity: item.current_quantity,
      tier: item.tier,
      priority: item.priority,
      rankOrder: item.rank_order,
      status: item.status,
      assignedMemberId: item.assigned_member_id,
      notes: item.notes,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));

    const contributions: MemberContribution[] = (contributionsData || []).map(contrib => ({
      id: contrib.id,
      memberId: contrib.member_id,
      memberName: (contrib.settlement_members as any).name,
      contributionType: contrib.contribution_type,
      itemName: contrib.item_name,
      quantity: contrib.quantity,
      description: contrib.description,
      contributedAt: new Date(contrib.contributed_at),
    }));

    const assignedMembers = (assignedData || []).map(assigned => ({
      id: (assigned.settlement_members as any).id,
      name: (assigned.settlement_members as any).name,
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
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      priority: projectData.priority,
      createdBy: projectData.created_by,
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