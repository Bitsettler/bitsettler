import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { addContribution, updateProjectItemQuantityByName, type AddContributionRequest } from '../../../../lib/spacetime-db-new/modules';
import { validateRequestBody, SETTLEMENT_SCHEMAS } from '@/lib/validation';

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

    // Validate and sanitize request body
    const validationResult = await validateRequestBody(request, SETTLEMENT_SCHEMAS.contribution);
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationResult.errors 
        },
        { status: 400 }
      );
    }

    const body = validationResult.data!;
    console.log('📋 Validated request body:', body);

    // Get the user's current claimed settlement member
    const { createServerClient } = await import('@/lib/spacetime-db-new/shared/supabase-client');
    const supabase = createServerClient();
    
    const { data: currentMember, error: memberError } = await supabase
      .from('settlement_members')
      .select('id, name')
      .eq('supabase_user_id', session.user.id!)
      .single();

    if (memberError || !currentMember) {
      console.log('❌ No claimed settlement member found for user');
      return NextResponse.json(
        {
          success: false,
          error: 'You must claim a settlement character before contributing to projects',
        },
        { status: 400 }
      );
    }

    console.log('✅ Found claimed member:', currentMember.name, 'ID:', currentMember.id);

    // Create contribution data using settlement member info
    const contributionData: AddContributionRequest = {
      memberId: currentMember.id,
      memberName: currentMember.name,
      projectId: body.projectId,
      projectItemId: body.projectItemId,
      contributionType: body.contributionType,
      deliveryMethod: body.deliveryMethod,
      itemName: body.itemName,
      quantity: body.quantity,
      description: body.notes,
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