import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { supabase } from '../../../../lib/spacetime-db-new/shared/supabase-client';
import { getAllProjects, getAllProjectsWithItems, createProject, type GetAllProjectsOptions, type CreateProjectRequest } from '../../../../lib/spacetime-db-new/modules';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const options: GetAllProjectsOptions = {
      status: searchParams.get('status') as 'Active' | 'Completed' | 'Cancelled' || undefined,
      includeItems: searchParams.get('includeItems') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    // Use appropriate function based on whether items are requested
    const projects = options.includeItems 
      ? await getAllProjectsWithItems(options)
      : await getAllProjects(options);

    return NextResponse.json({
      success: true,
      data: projects,
      count: projects.length,
      pagination: {
        limit: options.limit,
        offset: options.offset,
      },
      includesItems: options.includeItems || false,
    });

  } catch (error) {
    console.error('Settlement projects API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate Supabase Auth session
    const session = await getSupabaseSession(request);
    
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required to create projects',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields (no longer need createdBy in body)
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project name is required',
        },
        { status: 400 }
      );
    }

    // Create project data using authenticated user
    const projectData: CreateProjectRequest = {
      name: body.name,
      description: body.description,
      createdBy: session.user.name!, // Use NextAuth user name
      items: body.items || []
    };

    const result = await createProject(projectData);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Settlement project creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      },
      { status: 500 }
    );
  }
}

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