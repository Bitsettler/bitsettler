import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { createServerClient } from '../../../../../lib/spacetime-db-new/shared/supabase-client';
import { checkProjectPermissions } from '../../../../../lib/spacetime-db-new/modules/projects/permissions';
import { logProjectCompleted } from '../../../../../lib/settlement/project-activity-tracker';
import { withErrorHandlingParams, parseRequestBody, apiSuccess, apiError } from '@/lib/api-utils';
import { Result, ErrorCodes } from '@/lib/result';
import { logger } from '@/lib/logger';

interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: 'Active' | 'Completed' | 'Cancelled';
  priority?: number;
}

async function handleGetProject(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Result<unknown>> {
  const projectId = params.id;
  
  const supabase = createServerClient();
  if (!supabase) {
    return apiError('Database not available', ErrorCodes.OPERATION_FAILED);
  }

  try {
    // Determine if the ID is a UUID or a short_id
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    const isShortId = /^proj_[a-z0-9]{6}$/i.test(projectId);
    
    let query = supabase
      .from('settlement_projects')
      .select(`
        *,
        project_items (
          id,
          item_name,
          required_quantity,
          current_quantity,
          tier,
          priority,
          notes,
          created_at,
          updated_at
        )
      `);

    // Use appropriate field for lookup
    if (isUUID) {
      query = query.eq('id', projectId);
    } else if (isShortId) {
      query = query.eq('short_id', projectId);
    } else {
      return apiError('Invalid project ID format', ErrorCodes.INVALID_PARAMETER);
    }

    const { data: project, error } = await query.single();

    if (error) {
      throw error;
    }

    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }

    return apiSuccess(project);

  } catch (error) {
    logger.error('Failed to fetch project', error instanceof Error ? error : new Error(String(error)), {
      operation: 'GET_PROJECT',
      projectId
    });
    
    return apiError('Failed to fetch project', ErrorCodes.OPERATION_FAILED);
  }
}

async function handleUpdateProject(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Result<unknown>> {
  const projectId = params.id;
  
  // Check authentication
  const session = await getSupabaseSession(request);
  if (!session || !session.user) {
    return apiError('Authentication required', ErrorCodes.UNAUTHENTICATED);
  }

  const supabase = createServerClient();
  if (!supabase) {
    return apiError('Database not available', ErrorCodes.OPERATION_FAILED);
  }

  // First, resolve the project ID to get the actual UUID for permissions
  let actualProjectId = projectId;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
  const isShortId = /^proj_[a-z0-9]{6}$/i.test(projectId);
  
  if (!isUUID && !isShortId) {
    return apiError('Invalid project ID format', ErrorCodes.INVALID_PARAMETER);
  }

  if (isShortId) {
    const { data: project } = await supabase
      .from('settlement_projects')
      .select('id')
      .eq('short_id', projectId)
      .single();
    
    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }
    actualProjectId = project.id;
  }

  // Check permissions using the actual UUID
  const permissions = await checkProjectPermissions(actualProjectId, session.user.id, session.user.email);
  if (!permissions.canEdit) {
    return apiError('You do not have permission to edit this project', ErrorCodes.FORBIDDEN);
  }

  // Parse request body
  const bodyResult = await parseRequestBody<UpdateProjectData>(request);
  if (!bodyResult.success) {
    return bodyResult;
  }

  const updateData = bodyResult.data;

  try {
    // Get original project to compare status changes
    const { data: originalProject, error: getError } = await supabase
      .from('settlement_projects')
      .select('status, priority, name')
      .eq('id', actualProjectId)
      .single();

    if (getError) {
      throw getError;
    }

    const { data: updatedProject, error } = await supabase
      .from('settlement_projects')
      .update({
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.priority !== undefined && { priority: updateData.priority }),
        updated_at: new Date().toISOString()
      })
      .eq('id', actualProjectId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log project completion activity if status changed to 'Completed'
    if (updateData.status === 'Completed' && originalProject.status !== 'Completed') {
      try {
        await logProjectCompleted(
          actualProjectId,
          originalProject.name,
          originalProject.priority,
          session.user.id,
          session.user.name || session.user.email || 'Unknown User'
        );
      } catch (activityError) {
        console.warn('Failed to log project completion activity:', activityError);
        // Don't fail the update if activity logging fails
      }
    }

    logger.info('Project updated successfully', {
      operation: 'UPDATE_PROJECT',
      projectId: actualProjectId,
      originalProjectId: projectId,
      userId: session.user.id,
      updatedFields: Object.keys(updateData)
    });

    return apiSuccess(updatedProject, 'Project updated successfully');

  } catch (error) {
    logger.error('Failed to update project', error instanceof Error ? error : new Error(String(error)), {
      operation: 'UPDATE_PROJECT',
      projectId: actualProjectId,
      originalProjectId: projectId,
      userId: session.user.id,
      updateData
    });
    
    return apiError('Failed to update project', ErrorCodes.OPERATION_FAILED);
  }
}

async function handleDeleteProject(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Result<unknown>> {
  const projectId = params.id;
  
  // Check authentication
  const session = await getSupabaseSession(request);
  if (!session || !session.user) {
    return apiError('Authentication required', ErrorCodes.UNAUTHENTICATED);
  }

  const supabase = createServerClient();
  if (!supabase) {
    return apiError('Database not available', ErrorCodes.OPERATION_FAILED);
  }

  // First, resolve the project ID to get the actual UUID for permissions
  let actualProjectId = projectId;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
  const isShortId = /^proj_[a-z0-9]{6}$/i.test(projectId);
  
  if (!isUUID && !isShortId) {
    return apiError('Invalid project ID format', ErrorCodes.INVALID_PARAMETER);
  }

  if (isShortId) {
    const { data: project } = await supabase
      .from('settlement_projects')
      .select('id')
      .eq('short_id', projectId)
      .single();
    
    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }
    actualProjectId = project.id;
  }

  // Check permissions using the actual UUID
  const permissions = await checkProjectPermissions(actualProjectId, session.user.id, session.user.email);
  if (!permissions.canDelete) {
    return apiError('You do not have permission to delete this project', ErrorCodes.FORBIDDEN);
  }

  try {
    // Delete project (cascade will handle related data like project_items and contributions)
    const { error } = await supabase
      .from('settlement_projects')
      .delete()
      .eq('id', actualProjectId);

    if (error) {
      throw error;
    }

    logger.info('Project deleted successfully', {
      operation: 'DELETE_PROJECT',
      projectId: actualProjectId,
      originalProjectId: projectId,
      userId: session.user.id
    });

    return apiSuccess({ deleted: true }, 'Project deleted successfully');

  } catch (error) {
    logger.error('Failed to delete project', error instanceof Error ? error : new Error(String(error)), {
      operation: 'DELETE_PROJECT',
      projectId: actualProjectId,
      originalProjectId: projectId,
      userId: session.user.id
    });
    
    return apiError('Failed to delete project', ErrorCodes.OPERATION_FAILED);
  }
}

export const GET = withErrorHandlingParams(handleGetProject);
export const PUT = withErrorHandlingParams(handleUpdateProject);
export const DELETE = withErrorHandlingParams(handleDeleteProject);