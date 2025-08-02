import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { addContribution, updateProjectItemQuantityByName, type AddContributionRequest } from '../../../../lib/spacetime-db-new/modules';

export async function POST(request: NextRequest) {
  console.log('🔄 Settlement contribution API called');
  
  try {
    // Validate Supabase Auth session
    const session = await getSupabaseSession(request);
    
    if (!session || !session.user) {
      console.log('❌ No valid session found');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    console.log('✅ Valid session found for user:', session.user.name);

    const body = await request.json();
    console.log('📋 Request body:', body);

    // Validate required fields
    if (!body.projectId || !body.contributionType || !body.quantity) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        {
          success: false,
          error: 'projectId, contributionType, and quantity are required',
        },
        { status: 400 }
      );
    }

    // Create contribution data using session user info
    const contributionData: AddContributionRequest = {
      authUser: {
        id: session.user.id!,
        name: session.user.name!,
        email: session.user.email || undefined,
        image: session.user.image || undefined,
      },
      projectId: body.projectId,
      projectItemId: body.projectItemId,
      contributionType: body.contributionType,
      itemName: body.itemName,
      quantity: body.quantity,
      description: body.description,
    };

    console.log('✅ Validation passed, calling addContribution');
    
    // Add the contribution
    const contribution = await addContribution(contributionData);
    console.log('✅ Contribution added:', contribution.id);

    // Update project item quantity if this is a direct item contribution
    if (body.itemName && body.contributionType === 'Direct') {
      console.log('🔄 Updating project item quantity for:', body.itemName);
      await updateProjectItemQuantityByName(body.projectId, body.itemName, body.quantity);
      console.log('✅ Project item quantity updated');
    }

    return NextResponse.json({
      success: true,
      data: contribution,
    });

  } catch (error) {
    console.error('🔴 SETTLEMENT CONTRIBUTION API ERROR:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add contribution',
      },
      { status: 500 }
    );
  }
}