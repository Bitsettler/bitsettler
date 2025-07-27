import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, getAllProjectsWithItems, type GetAllProjectsOptions } from '../../../../lib/spacetime-db-new/modules';

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