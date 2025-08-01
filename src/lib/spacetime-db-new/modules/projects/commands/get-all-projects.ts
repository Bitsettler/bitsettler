import { createServerClient } from '../../../shared/supabase-client';

export interface SettlementProject {
  id: string;
  name: string;
  description: string | null;
  status: 'Active' | 'Completed' | 'Cancelled';
  priority: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectItem {
  id: string;
  projectId: string;
  itemName: string;
  requiredQuantity: number;
  currentQuantity: number;
  tier: number;
  priority: number;
  rankOrder: number;
  status: 'Needed' | 'In Progress' | 'Completed';
  assignedMemberId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithItems extends SettlementProject {
  items: ProjectItem[];
  completionPercentage: number;
  totalItems: number;
  completedItems: number;
}

export interface GetAllProjectsOptions {
  status?: 'Active' | 'Completed' | 'Cancelled';
  includeItems?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get all settlement projects
 */
export async function getAllProjects(options: GetAllProjectsOptions = {}): Promise<SettlementProject[]> {
  // Use service role client to bypass RLS for project queries
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning empty projects list');
    return [];
  }

  try {
    let query = supabase
      .from('settlement_projects')
      .select('*');

    // Apply filters
    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    // Order by priority and created date
    query = query.order('priority', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw handleSupabaseError(error, 'getting all projects');
    }

    return (data || []).map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      createdBy: project.created_by,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    }));

  } catch (error) {
    console.error('Error fetching settlement projects:', error);
    throw error;
  }
}

/**
 * Get all projects with their items and completion statistics
 */
export async function getAllProjectsWithItems(options: GetAllProjectsOptions = {}): Promise<ProjectWithItems[]> {
  // Use service role client to bypass RLS for project queries
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning empty projects list');
    return [];
  }

  try {
    // First get the projects
    const projects = await getAllProjects(options);

    if (projects.length === 0) {
      return [];
    }

    // Get project items for all projects
    const projectIds = projects.map(p => p.id);
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('project_items')
      .select('*')
      .in('project_id', projectIds)
      .order('rank_order')
      .order('priority', { ascending: false });

    if (itemsError) {
      throw handleSupabaseError(itemsError, 'getting project items');
    }

    // Group items by project
    const itemsByProject = new Map<string, ProjectItem[]>();
    
    (itemsData || []).forEach(item => {
      if (!itemsByProject.has(item.project_id)) {
        itemsByProject.set(item.project_id, []);
      }
      
      itemsByProject.get(item.project_id)!.push({
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
        notes: null, // TEMPORARILY SET TO NULL since column doesn't exist
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      });
    });

    // Combine projects with items and calculate completion
    return projects.map(project => {
      const items = itemsByProject.get(project.id) || [];
      const completedItems = items.filter(item => item.status === 'Completed').length;
      const totalItems = items.length;
      const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        ...project,
        items,
        completionPercentage,
        totalItems,
        completedItems,
      };
    });

  } catch (error) {
    console.error('Error fetching projects with items:', error);
    throw error;
  }
} 