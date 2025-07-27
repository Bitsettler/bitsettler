import { NextRequest, NextResponse } from 'next/server';
import { getAllMembers, type GetAllMembersOptions } from '../../../../lib/spacetime-db-new/modules';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const options: GetAllMembersOptions = {
      includeInactive: searchParams.get('includeInactive') === 'true',
      profession: searchParams.get('profession') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const members = await getAllMembers(options);

    return NextResponse.json({
      success: true,
      data: members,
      count: members.length,
      pagination: {
        limit: options.limit,
        offset: options.offset,
      },
    });

  } catch (error) {
    console.error('Settlement members API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch members',
      },
      { status: 500 }
    );
  }
} 