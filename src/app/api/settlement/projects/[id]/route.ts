import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { createServerClient } from '../../../../../lib/spacetime-db-new/shared/supabase-client';
// import { checkProjectPermissions } from '../../../../../lib/spacetime-db-new/modules/projects/permissions'; // DISABLED
import { logProjectCompleted } from '../../../../../lib/settlement/project-activity-tracker';
import { withErrorHandlingParams, parseRequestBody, apiSuccess, apiError } from '@/lib/api-utils';
import { Result, ErrorCodes } from '@/lib/result';
import { logger } from '@/lib/logger';
import { getProjectById } from '../../../../../lib/spacetime-db-new/modules/projects/commands/get-project-by-id';

interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: 'Active' | 'Completed' | 'Cancelled';
  priority?: number;
}

async function handleGetProject(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Result<unknown>> {
  const { id: projectId } = await params;
  
  try {
    // Handle both UUID and project number formats
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    const isProjectNumber = /^\d+$/.test(projectId);
    
    let actualProjectId = projectId;
    
    // If project number, convert to UUID
    if (isProjectNumber) {
      const supabase = createServerClient();
      if (!supabase) {
        return apiError('Database not available', ErrorCodes.OPERATION_FAILED);
      }
      
      const { data: project, error } = await supabase
        .from('projects')
        .select('id')
        .eq('project_number', parseInt(projectId))
        .single();
        
      if (error || !project) {
        return apiError('Project not found', ErrorCodes.NOT_FOUND);
      }
      
      actualProjectId = project.id;
    } else if (!isUUID) {
      return apiError('Invalid project ID format', ErrorCodes.INVALID_PARAMETER);
    }

    // Use the proper function that includes contributions
    const projectDetails = await getProjectById(actualProjectId);

    if (!projectDetails) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }

    return apiSuccess(projectDetails);

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
  { params }: { params: Promise<{ id: string }> }
): Promise<Result<unknown>> {
  const { id: projectId } = await params;
  
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
  const isProjectNumber = /^\d+$/.test(projectId);
  
  if (!isUUID && !isShortId && !isProjectNumber) {
    return apiError('Invalid project ID format', ErrorCodes.INVALID_PARAMETER);
  }

  if (isProjectNumber) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('project_number', parseInt(projectId))
      .single();
    
    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }
    actualProjectId = project.id;
  } else if (isShortId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('short_id', projectId)
      .single();
    
    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }
    actualProjectId = project.id;
  }

  // PERMISSION CHECK DISABLED - Everyone can edit projects

  // Parse request body
  const bodyResult = await parseRequestBody<UpdateProjectData>(request);
  if (!bodyResult.success) {
    return bodyResult;
  }

  const updateData = bodyResult.data;

  try {
    // Get original project to compare status changes
    const { data: originalProject, error: getError } = await supabase
      .from('projects')
      .select('status, priority, name')
      .eq('id', actualProjectId)
      .single();

    if (getError) {
      throw getError;
    }

    const { data: updatedProject, error } = await supabase
      .from('projects')
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
        // Get current user's settlement member
        const { data: currentMember } = await supabase
          .from('players')
          .select('id, name')
          .eq('supabase_user_id', session.user.id)
          .single();
        
        if (currentMember) {
          await logProjectCompleted(
            actualProjectId,
            originalProject.name,
            originalProject.priority,
            currentMember.id,
            currentMember.name
          );
        }
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
  { params }: { params: Promise<{ id: string }> }
): Promise<Result<unknown>> {
  const { id: projectId } = await params;
  
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
  const isProjectNumber = /^\d+$/.test(projectId);
  
  if (!isUUID && !isShortId && !isProjectNumber) {
    return apiError('Invalid project ID format', ErrorCodes.INVALID_PARAMETER);
  }

  if (isProjectNumber) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('project_number', parseInt(projectId))
      .single();
    
    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }
    actualProjectId = project.id;
  } else if (isShortId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('short_id', projectId)
      .single();
    
    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }
    actualProjectId = project.id;
  }

  // PERMISSION CHECK DISABLED - Everyone can delete projects

  try {
    // Delete project (cascade will handle related data like items and contributions)
    const { error } = await supabase
      .from('projects')
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

// export const GET = withErrorHandlingParams(handleGetProject);
// export const PUT = withErrorHandlingParams(handleUpdateProject);
// export const DELETE = withErrorHandlingParams(handleDeleteProject);

// Temporary direct handlers to bypass withErrorHandlingParams wrapper for debugging
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log('Direct Project Detail API: Starting GET...');
    const result = await handleGetProject(request, context);
    console.log('Direct Project Detail API: Handler result:', result.success, typeof result);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        code: result.code
      }, { status: 500 });
    }
  } catch (error) {
    console.log('Direct Project Detail API: Caught error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const result = await handleUpdateProject(request, context);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        code: result.code
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const result = await handleDeleteProject(request, context);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        code: result.code
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}