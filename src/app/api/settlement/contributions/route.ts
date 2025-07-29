import { NextRequest, NextResponse } from 'next/server';
import { addContribution, updateProjectItemQuantity, type AddContributionRequest } from '../../../../lib/spacetime-db-new/modules';

export async function POST(request: NextRequest) {
  try {
    const body: AddContributionRequest = await request.json();

    // Validate required fields
    if (!body.memberId || !body.projectId || !body.contributionType || !body.quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'memberId, projectId, contributionType, and quantity are required',
        },
        { status: 400 }
      );
    }

    // Add the contribution
    const contribution = await addContribution(body);

    // Update project item quantity if this is an item contribution
    if (body.projectItemId && body.contributionType === 'Item') {
      await updateProjectItemQuantity(body.projectItemId, body.quantity);
    }

    return NextResponse.json({
      success: true,
      data: contribution,
    });

  } catch (error) {
    console.error('Settlement contribution creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add contribution',
      },
      { status: 500 }
    );
  }
}