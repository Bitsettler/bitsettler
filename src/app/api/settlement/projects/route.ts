import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { supabase, createServerClient } from '../../../../lib/spacetime-db-new/shared/supabase-client';
import { getAllProjects, getAllProjectsWithItems, createProject, type GetAllProjectsOptions, type CreateProjectRequest } from '../../../../lib/spacetime-db-new/modules';
import { withErrorHandling, parseRequestBody, requireBodyFields, apiSuccess, apiError } from '@/lib/api-utils';
import { Result, ErrorCodes } from '@/lib/result';
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

async function handleGetProjects(request: NextRequest): Promise<Result<ProjectsData>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters first
    const options: GetAllProjectsOptions = {
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

    return apiSuccess({
      projects,
      count: projects.length,
      pagination: {
        limit: options.limit,
        offset: options.offset,
      },
      includesItems: options.includeItems || false,
    });

  } catch (error) {
    logger.error('Projects API: Failed to fetch settlement projects', error instanceof Error ? error : new Error(String(error)), {
      operation: 'GET_SETTLEMENT_PROJECTS',
      options,
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
    console.log('Direct Projects API: Starting...');
    const result = await handleGetProjects(request);
    console.log('Direct Projects API: Handler result:', result.success, typeof result);
    
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
    console.log('Direct Projects API: Caught error:', error);
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
    name: string;
    description?: string;
    items?: Array<unknown>;
  }>(request);
  if (!bodyResult.success) {
    return bodyResult;
  }

  const body = bodyResult.data;

  // Validate required fields
  if (!body.name) {
    return apiError(
      'Project name is required',
      ErrorCodes.MISSING_PARAMETER
    );
  }

  // Create project data using authenticated user
  const projectData: CreateProjectRequest = {
    name: body.name,
    description: body.description,
    createdBy: session.user.name!,
    items: body.items || []
  };

  logger.info('Creating new settlement project', {
    operation: 'CREATE_PROJECT',
    userId: session.user.id,
    projectName: body.name
  });

  try {
    const result = await createProject(projectData);

    logger.info('Project created successfully', {
      projectId: result.id,
      projectName: result.name,
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