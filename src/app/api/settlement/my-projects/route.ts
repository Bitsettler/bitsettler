import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase-server-auth';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { withErrorHandling, apiSuccess, apiError } from '@/lib/api-utils';
import { Result, ErrorCodes } from '@/lib/result';
import { logger } from '@/lib/logger';

interface MyProject {
  id: string;
  short_id: string | null;
  name: string;
  description: string | null;
  status: 'Active' | 'Completed' | 'Cancelled';
  priority: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberRole: string;
  joinedAt: Date;
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
}

async function handleGetMyProjects(request: NextRequest): Promise<Result<{ projects: MyProject[] }>> {
  try {
    // Authenticate user
    const user = await requireAuth(request);

    logger.info('Fetching user projects', {
      operation: 'GET_MY_PROJECTS',
      userId: user.id
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
      .select('id')
      .eq('supabase_user_id', user.id)
      .single();

    if (memberError || !member) {
      return apiError(
        'Settlement member record not found. Please claim your character first.',
        ErrorCodes.NOT_FOUND
      );
    }

    // Get projects where user is a member with comprehensive project data
    const { data: projectMemberships, error: membershipError } = await supabase
      .from('project_members')
      .select(`
        role,
        assigned_at,
        settlement_projects!inner(
          id,
          short_id,
          name,
          description,
          status,
          priority,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('member_id', member.id)
      .order('assigned_at', { ascending: false });

    if (membershipError) {
      logger.error('Failed to fetch user project memberships', membershipError, {
        userId: user.id,
        memberId: member.id
      });
      
      return apiError(
        'Failed to fetch your projects',
        ErrorCodes.DATABASE_ERROR
      );
    }

    // Get project completion statistics for each project
    const projectIds = projectMemberships?.map(pm => pm.settlement_projects.id) || [];
    let projectStats: Record<string, { total: number; completed: number }> = {};

    if (projectIds.length > 0) {
      const { data: itemStats, error: statsError } = await supabase
        .from('project_items')
        .select('project_id, status')
        .in('project_id', projectIds);

      if (!statsError && itemStats) {
        // Calculate completion stats for each project
        projectStats = itemStats.reduce((acc, item) => {
          if (!acc[item.project_id]) {
            acc[item.project_id] = { total: 0, completed: 0 };
          }
          acc[item.project_id].total++;
          if (item.status === 'Completed') {
            acc[item.project_id].completed++;
          }
          return acc;
        }, {} as Record<string, { total: number; completed: number }>);
      }
    }

    // Transform the data
    const projects: MyProject[] = (projectMemberships || []).map(membership => {
      const project = membership.settlement_projects;
      const stats = projectStats[project.id] || { total: 0, completed: 0 };
      const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        id: project.id,
        short_id: project.short_id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        createdBy: project.created_by,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
        memberRole: membership.role,
        joinedAt: new Date(membership.assigned_at),
        totalItems: stats.total,
        completedItems: stats.completed,
        completionPercentage
      };
    });

    logger.info('Successfully fetched user projects', {
      userId: user.id,
      projectCount: projects.length
    });

    return apiSuccess({
      projects
    });

  } catch (error) {
    logger.error('Error in get my projects handler', error instanceof Error ? error : new Error(String(error)));
    return apiError(
      'Internal server error while fetching projects',
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

export const GET = withErrorHandling(handleGetMyProjects);