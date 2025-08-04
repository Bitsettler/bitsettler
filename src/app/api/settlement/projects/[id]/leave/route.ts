import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-server-auth';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { withErrorHandlingParams, apiSuccess, apiError } from '@/lib/api-utils';
import { Result, ErrorCodes } from '@/lib/result';
import { logger } from '@/lib/logger';

async function handleLeaveProject(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
): Promise<Result<{ message: string }>> {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return apiError(
        authResult.error,
        ErrorCodes.UNAUTHORIZED
      );
    }

    const { user } = authResult;
    const { id: projectId } = await context.params;

    logger.info('User leaving project', {
      operation: 'LEAVE_PROJECT',
      userId: user.id,
      projectId
    });

    // Get supabase client
    const supabase = createServerClient();
    if (!supabase) {
      return apiError(
        'Database service unavailable',
        ErrorCodes.CONFIGURATION_ERROR
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
        'Settlement member record not found',
        ErrorCodes.NOT_FOUND
      );
    }

    // Check if user is actually a member of this project
    const { data: projectMember, error: membershipError } = await supabase
      .from('project_members')
      .select('id, role')
      .eq('project_id', projectId)
      .eq('member_id', member.id)
      .single();

    if (membershipError || !projectMember) {
      return apiError(
        'You are not a member of this project',
        ErrorCodes.NOT_FOUND
      );
    }

    // Get project info for logging
    const { data: project } = await supabase
      .from('settlement_projects')
      .select('name')
      .eq('id', projectId)
      .single();

    // Remove from project
    const { error: leaveError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('member_id', member.id);

    if (leaveError) {
      logger.error('Failed to leave project', leaveError, {
        userId: user.id,
        projectId,
        memberId: member.id
      });
      
      return apiError(
        'Failed to leave project',
        ErrorCodes.DATABASE_ERROR
      );
    }

    logger.info('User successfully left project', {
      userId: user.id,
      projectId,
      memberName: member.name,
      previousRole: projectMember.role,
      projectName: project?.name || 'Unknown Project'
    });

    return apiSuccess({
      message: `Successfully left "${project?.name || 'the project'}"`
    });

  } catch (error) {
    logger.error('Error in leave project handler', error instanceof Error ? error : new Error(String(error)));
    return apiError(
      'Internal server error while leaving project',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

export const DELETE = withErrorHandlingParams(handleLeaveProject);