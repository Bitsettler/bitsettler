import { createServerClient } from '../../../shared/supabase-client';
import { SettlementProject, ProjectItem } from './get-all-projects';
import { logProjectCreated } from '../../../../settlement/project-activity-tracker';

export interface CreateProjectRequest {
  name: string
  description?: string
  status?: 'Active' | 'Completed' | 'Cancelled'
  priority?: number
  createdByMemberId: string
  items?: CreateProjectItemRequest[]
}

export interface CreateProjectItemRequest {
  itemName: string;
  requiredQuantity: number;
  tier?: number;
  priority?: number;
  rankOrder?: number;
  notes?: string;
}

export interface CreateProjectResponse {
  project: SettlementProject;
  items: ProjectItem[];
}

/**
 * Create a new settlement project with optional items
 */
export async function createProject(projectData: CreateProjectRequest): Promise<CreateProjectResponse> {
  // Use service role client to bypass RLS for project operations
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Supabase service role client not available for project creation');
  }

  try {
    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('settlement_projects')
      .insert({
        name: projectData.name,
        description: projectData.description || null,
        status: projectData.status || 'Active',
        priority: projectData.priority || 3,
        created_by_member_id: projectData.createdByMemberId,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Failed to create project:', projectError);
      throw new Error(`Database operation failed: creating project - ${projectError.message}`);
    }

    const createdProject: SettlementProject = {
      id: project.id,
      project_number: project.project_number,
      short_id: project.short_id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      createdByMemberId: project.created_by_member_id,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    };

    let createdItems: ProjectItem[] = [];

    // Create project items if provided
    if (projectData.items && projectData.items.length > 0) {
      // Validate items before attempting insert
      const validItems = projectData.items.filter(item => {
        if (!item.itemName || typeof item.itemName !== 'string' || item.itemName.trim() === '') {
          console.warn('Skipping item with invalid name:', item);
          return false;
        }
        return true;
      });

      if (validItems.length === 0) {
        console.warn('No valid items to insert');
        return {
          project: createdProject,
          items: [],
        };
      }

      const itemsToInsert = validItems.map((item, index) => ({
        project_id: project.id,
        item_name: item.itemName.trim(),
        required_quantity: Math.max(1, item.requiredQuantity || 1), // Ensure quantity > 0
        tier: Math.max(1, Math.min(10, item.tier || 1)), // Ensure tier is 1-10 to match brico's system
        priority: Math.max(1, Math.min(5, item.priority || 3)), // Ensure priority is 1-5
        rank_order: item.rankOrder !== undefined ? item.rankOrder : index,
        notes: item.notes && item.notes.trim() ? item.notes.trim() : null,
      }));

      console.log('Attempting to insert project items:', {
        projectId: project.id,
        itemCount: itemsToInsert.length,
        items: itemsToInsert
      });

      const { data: items, error: itemsError } = await supabase
        .from('project_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('🔴 PROJECT ITEMS CREATION FAILED:', {
          error: itemsError,
          errorCode: itemsError.code,
          errorMessage: itemsError.message,
          errorDetails: itemsError.details,
          errorHint: itemsError.hint,
          projectId: project.id,
          itemsToInsert,
          itemCount: itemsToInsert.length
        });
        
        // THROW the error instead of silently failing
        throw new Error(`Failed to create project items: ${itemsError.message}. ${itemsError.hint || ''}`);
      }

      createdItems = (items || []).map(item => ({
        id: item.id,
        projectId: item.project_id,
        itemName: item.item_name,
        requiredQuantity: item.required_quantity,
        currentQuantity: item.current_quantity,
        tier: item.tier,
        priority: item.priority,
        rankOrder: item.rank_order,
        status: item.status,
        assignedMemberId: null, // assigned_member_id column doesn't exist in project_items table
        notes: item.notes,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));
    }

    // Log project creation activity
    try {
      // Get creator member name
      const { data: creatorMember } = await supabase
        .from('settlement_members')
        .select('name')
        .eq('id', projectData.createdByMemberId)
        .single();
      
      await logProjectCreated(
        createdProject.id,
        createdProject.name,
        createdProject.priority,
        projectData.createdByMemberId,
        creatorMember?.name || 'Unknown Member'
      );
    } catch (activityError) {
      console.warn('Failed to log project creation activity:', activityError);
      // Don't fail the project creation if activity logging fails
    }

    return {
      project: createdProject,
      items: createdItems,
    };

  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}