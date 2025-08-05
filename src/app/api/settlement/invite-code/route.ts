import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';

/**
 * Settlement Invite Code Management API
 * 
 * GET: Retrieve current invite code for user's settlement
 * POST: Regenerate invite code (requires officer permissions)
 */

export async function GET(request: NextRequest) {
  try {
    // Verify authentication using proper header handling
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { session, user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Get user's settlement member data
    const { data: member, error: memberError } = await supabase
      .from('settlement_members')
      .select('settlement_id, name, officer_permission, co_owner_permission')
      .eq('supabase_user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'User is not a member of any settlement' },
        { status: 404 }
      );
    }

    // Get settlement invite code
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements_master')
      .select('id, name, invite_code, invite_code_generated_at, invite_code_last_regenerated_at')
      .eq('id', member.settlement_id)
      .single();

    if (settlementError || !settlement) {
      return NextResponse.json(
        { success: false, error: 'Settlement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        settlement: {
          id: settlement.id,
          name: settlement.name
        },
        inviteCode: settlement.invite_code,
        generatedAt: settlement.invite_code_generated_at,
        lastRegeneratedAt: settlement.invite_code_last_regenerated_at,
        canRegenerate: member.officer_permission > 0 || member.co_owner_permission > 0
      }
    });

  } catch (error) {
    // Get invite code error
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication using proper header handling
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { session, user } = authResult;
    const supabase = await createServerSupabaseClient();

    // Get user's settlement member data with permissions
    const { data: member, error: memberError } = await supabase
      .from('settlement_members')
      .select('settlement_id, name, officer_permission, co_owner_permission')
      .eq('supabase_user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'User is not a member of any settlement' },
        { status: 404 }
      );
    }

    // Check permissions - only officers and co-owners can regenerate invite codes
    if (member.officer_permission === 0 && member.co_owner_permission === 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to regenerate invite code' },
        { status: 403 }
      );
    }

    // Regenerate invite code using database function
    const { data: newInviteCode, error: codeError } = await supabase
      .rpc('regenerate_settlement_invite_code', {
        p_settlement_id: member.settlement_id,
        p_regenerated_by: user.id
      });

    if (codeError || !newInviteCode) {
      // Failed to regenerate invite code
      return NextResponse.json(
        { success: false, error: 'Failed to regenerate invite code' },
        { status: 500 }
      );
    }

    // Get updated settlement data
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements_master')
      .select('id, name, invite_code_generated_at, invite_code_last_regenerated_at')
      .eq('id', member.settlement_id)
      .single();

    // Invite code regenerated successfully

    return NextResponse.json({
      success: true,
      message: 'Invite code regenerated successfully',
      data: {
        inviteCode: newInviteCode,
        regeneratedAt: settlement?.invite_code_last_regenerated_at,
        regeneratedBy: member.name
      }
    });

  } catch (error) {
    // Regenerate invite code error
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during invite code regeneration'
    }, { status: 500 });
  }
}