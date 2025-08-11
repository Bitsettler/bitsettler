import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { supabase, createServerClient } from '../../../../lib/spacetime-db-new/shared/supabase-client';
import { getAllProjects, getAllProjectsWithItems, createProject, type GetAllProjectsOptions, type CreateProjectRequest, CreateProjectItemRequest } from '../../../../lib/spacetime-db-new/modules';
import { withErrorHandling, parseRequestBody, requireBodyFields, apiSuccess, apiError } from '@/lib/api-utils';
import { Result, ErrorCodes, error } from '@/lib/result';
import { logger } from '@/lib/logger';

interface ProjectsData {
  projects: Array<unknown>; // From getAllProjects result
  count: number;
  pagination: {
    limit?: number;
    offset?: number;
  };
  includesItems: boolean;
}

interface ProjectsResponseType {
  data: ProjectsData;
  message: string | undefined;
}

async function handleGetProjects(request: NextRequest): Promise<Result<ProjectsResponseType>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const settlementId = searchParams.get('settlementId');

    if( !settlementId )
      return apiError(
        `Failed to fetch projects: Missing settlementId parameter`,
        ErrorCodes.MISSING_PARAMETER
      );
    
    // Parse query parameters first
    const options: GetAllProjectsOptions = {
      settlementId: settlementId,
      status: searchParams.get('status') as 'Active' | 'Completed' | 'Cancelled' || undefined,
      includeItems: searchParams.get('includeItems') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    logger.info('Projects API: Starting request', {
      operation: 'GET_SETTLEMENT_PROJECTS',
      options,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    
    // Check if service client is available
    const serverClient = createServerClient();
    if (!serverClient) {
      logger.error('Projects API: No service client available', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
      
      return apiError(
        'Database service unavailable. Please ensure SUPABASE_SERVICE_ROLE_KEY environment variable is configured.',
        ErrorCodes.CONFIGURATION_ERROR
      );
    }
    
    logger.info('Projects API: Service client available, fetching data');

    // Use appropriate function based on whether items are requested
    const projects = options.includeItems 
      ? await getAllProjectsWithItems(options)
      : await getAllProjects(options);

    logger.info(`Projects API: Successfully fetched ${projects.length} projects`, {
      count: projects.length,
      includesItems: options.includeItems || false
    });

    const result: ProjectsData = {
      projects,
      count: projects.length,
      pagination: {
        limit: options.limit,
        offset: options.offset,
      },
      includesItems: options.includeItems || false,
    }

    return {
      success: true,
      data: {
        data: result,
        message: "Fetched projects list successfully!"
      }
    };

  } catch (error) {
    logger.error('Projects API: Failed to fetch settlement projects', error instanceof Error ? error : new Error(String(error)), {
      operation: 'GET_SETTLEMENT_PROJECTS',
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    
    return apiError(
      `Failed to fetch projects: ${error instanceof Error ? error.message : String(error)}`,
      ErrorCodes.DATABASE_ERROR
    );
  }
}

// export const GET = withErrorHandling(handleGetProjects);

// Temporary direct handler to bypass withErrorHandling wrapper for debugging
export async function GET(request: NextRequest) {
  try {
    const result = await handleGetProjects(request);
    
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
    // Error caught in projects API
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function handleCreateProject(request: NextRequest): Promise<Result<unknown>> {
  // Check authentication
  const session = await getSupabaseSession(request);
  
  if (!session || !session.user) {
    logger.warn('Unauthenticated project creation attempt');
    return apiError(
      'Authentication required to create projects',
      ErrorCodes.UNAUTHENTICATED
    );
  }

  // Parse and validate request body
  const bodyResult = await parseRequestBody<{
    name: string
    description?: string
    priority?: number
    items?: Array<CreateProjectItemRequest>
    createdByMemberId?: string
    settlementId?: string
  }>(request)
  if (!bodyResult.success) {
    return bodyResult;
  }

  const body = bodyResult.data;

  // Validate required fields
  if (!body.name || !body.createdByMemberId || !body.settlementId) {
    return apiError(
      'Project name and createdByMemberId are required',
      ErrorCodes.MISSING_PARAMETER
    );
  }

  // Create project data using authenticated user
  const userName = session.user.email || session.user.id || 'Unknown User';
  
  const projectData: CreateProjectRequest = {
    name: body.name,
    description: body.description,
    priority: body.priority,
    createdByMemberId: body.createdByMemberId,
    settlementId: body.settlementId,
    items: body.items || []
  };

  logger.info('Project creation request details', {
    userName,
    userInfo: {
      id: session.user.id,
      name: userName,
      email: session.user.email
    },
    projectData: {
      name: body.name,
      itemCount: body.items?.length || 0
    }
  });

  logger.info('Creating new settlement project', {
    operation: 'CREATE_PROJECT',
    userId: session.user.id,
    projectName: body.name
  });

  try {
    const result = await createProject(projectData);

    logger.info('Project created successfully', {
      projectId: result.project.id,
      projectName: result.project.name,
      userId: session.user.id
    });

    return apiSuccess(result, 'Project created successfully');

  } catch (error) {
    logger.error('Failed to create project', error instanceof Error ? error : new Error(String(error)), {
      operation: 'CREATE_PROJECT',
      userId: session.user.id,
      projectData
    });
    
    return apiError(
      'Failed to create project',
      ErrorCodes.OPERATION_FAILED
    );
  }
}

export const POST = withErrorHandling(handleCreateProject);

export async function DELETE(_request: NextRequest) {
  try {
    // Import supabase client
    const { createServerClient } = await import('../../../../lib/spacetime-db-new/shared/supabase-client');
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database not available',
        },
        { status: 503 }
      );
    }

    // Delete all projects (cascade will handle related data)
    const { error } = await supabase
      .from('settlement_projects')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all records (created_at is always >= epoch)

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'All projects deleted successfully',
    });

  } catch (error) {
    console.error('Settlement projects deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete projects',
      },
      { status: 500 }
    );
  }
} 