import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server-auth';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { withErrorHandlingParams, apiSuccess, apiError } from '@/lib/api-utils';
import { Result, ErrorCodes } from '@/lib/result';
import { logger } from '@/lib/logger';

interface JoinProjectRequest {
  role?: 'Leader' | 'Contributor' | 'Observer';
}

async function handleJoinProject(
  request: NextRequest, 
  context: { params: { id: string } }
): Promise<Result<{ message: string; member: any }>> {
  try {
    // Authenticate user
    const user = await requireAuth(request);
    const { id: projectId } = context.params;

    logger.info('User joining project', {
      operation: 'JOIN_PROJECT',
      userId: user.id,
      projectId
    });

    // Parse request body for role (optional)
    let role = 'Contributor'; // Default role
    try {
      const body: JoinProjectRequest = await request.json();
      if (body.role && ['Leader', 'Contributor', 'Observer'].includes(body.role)) {
        role = body.role;
      }
    } catch {
      // Body is optional, use default role
    }

    // Get supabase client
    const supabase = createServerClient();
    if (!supabase) {
      return apiError(
        'Database service unavailable',
        ErrorCodes.CONFIGURATION_ERROR
      );
    }

    // First verify the project exists
    const { data: project, error: projectError } = await supabase
      .from('settlement_projects')
      .select('id, name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return apiError(
        'Project not found',
        ErrorCodes.NOT_FOUND
      );
    }

    // Get the user's settlement member record
    const { data: member, error: memberError } = await supabase
      .from('settlement_members')
      .select('id, name')
      .eq('supabase_user_id', user.id)
      .single();

    if (memberError || !member) {
      return apiError(
        'Settlement member record not found. Please claim your character first.',
        ErrorCodes.NOT_FOUND
      );
    }

    // Check if already joined
    const { data: existing, error: existingError } = await supabase
      .from('project_members')
      .select('id, role')
      .eq('project_id', projectId)
      .eq('member_id', member.id)
      .single();

    if (existing && !existingError) {
      return apiError(
        `You are already a ${existing.role.toLowerCase()} on this project`,
        ErrorCodes.ALREADY_EXISTS
      );
    }

    // Join the project
    const { data: projectMember, error: joinError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        member_id: member.id,
        role: role
      })
      .select()
      .single();

    if (joinError) {
      logger.error('Failed to join project', joinError, {
        userId: user.id,
        projectId,
        memberId: member.id,
        role
      });
      
      return apiError(
        'Failed to join project',
        ErrorCodes.DATABASE_ERROR
      );
    }

    logger.info('User successfully joined project', {
      userId: user.id,
      projectId,
      memberName: member.name,
      role,
      projectName: project.name
    });

    return apiSuccess({
      message: `Successfully joined "${project.name}" as ${role}`,
      member: {
        id: projectMember.id,
        memberId: member.id,
        memberName: member.name,
        role: projectMember.role,
        assignedAt: new Date(projectMember.assigned_at)
      }
    });

  } catch (error) {
    logger.error('Error in join project handler', error instanceof Error ? error : new Error(String(error)));
    return apiError(
      'Internal server error while joining project',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

export const POST = withErrorHandlingParams(handleJoinProject);