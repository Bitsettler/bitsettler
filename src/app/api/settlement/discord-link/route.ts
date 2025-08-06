import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase-server-auth';

export async function POST(request: NextRequest) {
  try {
    const { settlementId, discordLink } = await request.json();

    if (!settlementId) {
      return NextResponse.json(
        { success: false, error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    // Validate Discord link format if provided
    if (discordLink && discordLink.trim()) {
      const discordRegex = /^https?:\/\/(discord\.(gg|com)\/|discordapp\.com\/invite\/).+$/;
      if (!discordRegex.test(discordLink.trim())) {
        return NextResponse.json(
          { success: false, error: 'Invalid Discord link format' },
          { status: 400 }
        );
      }
    }

    // Get Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage this settlement
    // User must be a member with officer or co-owner permissions
    const { data: memberData, error: memberError } = await supabase
      .from('settlement_members')
      .select('officer_permission, co_owner_permission')
      .eq('settlement_id', settlementId)
      .eq('supabase_user_id', user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this settlement' },
        { status: 403 }
      );
    }

    // Check if user has management permissions (flexible with permission types)
    const hasManagementPermission = 
      memberData.officer_permission > 0 || 
      memberData.officer_permission === true ||
      memberData.co_owner_permission > 0 || 
      memberData.co_owner_permission === true;
    
    if (!hasManagementPermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to manage settlement settings. Officer or Co-Owner permissions required.' },
        { status: 403 }
      );
    }

    // Update the Discord link in settlements_master
    const { error: updateError } = await supabase
      .from('settlements_master')
      .update({ 
        discord_link: discordLink?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', settlementId);

    if (updateError) {
      console.error('Error updating Discord link:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update Discord link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discord link updated successfully'
    });

  } catch (error) {
    console.error('Error in Discord link API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    if (!settlementId) {
      return NextResponse.json(
        { success: false, error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createServerSupabaseClient();

    // Fetch Discord link from settlements_master
    const { data: settlementData, error: fetchError } = await supabase
      .from('settlements_master')
      .select('discord_link')
      .eq('id', settlementId)
      .single();

    if (fetchError) {
      console.error('Error fetching Discord link:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch Discord link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      discordLink: settlementData?.discord_link || null
    });

  } catch (error) {
    console.error('Error in Discord link GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}