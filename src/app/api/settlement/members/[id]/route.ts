import { NextRequest, NextResponse } from 'next/server';
import { getMemberById } from '../../../../../lib/spacetime-db-new/modules';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member ID is required',
        },
        { status: 400 }
      );
    }

    const member = await getMemberById(memberId);

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: member,
    });

  } catch (error) {
    console.error('Settlement member detail API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch member details',
      },
      { status: 500 }
    );
  }
} 