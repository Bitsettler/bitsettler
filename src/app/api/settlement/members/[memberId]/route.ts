import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    if (!settlementId) {
      return NextResponse.json(
        { error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    let { data: member, error: memberError } = await supabase
      .from('settlement_members')
      .select('*')
      .eq('settlement_id', settlementId)
      .eq('player_entity_id', memberId)
      .maybeSingle();

    if (memberError) {
      console.error('Member lookup error:', memberError);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (!member) {
      console.log(`❌ Member ${memberId} not found in settlement_members table`);
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found member ${member.name} in unified table`);

    let { data: settlement, error: settlementError } = await supabase
      .from('settlements_master')
      .select('*')
      .eq('id', settlementId)
      .maybeSingle();

      if (settlementError) {
        console.error('Settlement lookup error:', settlementError);
        return NextResponse.json(
          { error: 'Database query failed' },
          { status: 500 }
        );
      }
  
      if (!settlement) {
        console.log(`❌ Member ${settlementId} not found in settlements_master table`);
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }

    // Transform to API format - all data already available!
    const formattedMember = {
      id: member.entity_id,
      name: member.name,
      settlement_name: settlement.name,
      entityId: member.entity_id,
      playerEntityId: member.player_entity_id,
      profession: member.top_profession || 'Unknown',
      primary_profession: member.primary_profession,
      secondary_profession: member.secondary_profession,
      top_profession: member.top_profession,
      totalSkillLevel: member.total_level || 0,
      totalXP: member.total_xp || 0,
      highestLevel: member.highest_level || 0,
      totalSkills: member.total_skills || 0,
      skills: member.skills || {}, // Already in {skillName: level} format!
      permissions: {
        inventory: member.inventory_permission || 0,
        build: member.build_permission || 0,
        officer: member.officer_permission || 0,
        coOwner: member.co_owner_permission || 0
      },
      lastLogin: member.last_login_timestamp,
      joinedAt: member.joined_settlement_at,
      isActive: member.is_active,
      lastSyncInfo: member.last_synced_at ? `Last synced: ${new Date(member.last_synced_at).toLocaleString()}` : 'Never synced',
      // Discord avatar data
      discord_user_id: member.discord_user_id,
      discord_username: member.discord_username,
      discord_global_name: member.discord_global_name,
      discord_avatar_hash: member.discord_avatar_hash,
      discord_avatar_url: member.discord_avatar_url,
      // App user data (if claimed)
      displayName: member.display_name,
      discordHandle: member.discord_handle,
      bio: member.bio,
      timezone: member.timezone,
      isClaimed: !!member.supabase_user_id,
      appJoinedAt: member.app_joined_at,
      appLastActiveAt: member.app_last_active_at
    };

    return NextResponse.json({
      success: true,
      data: formattedMember,
      meta: {
        dataSource: 'unified_settlement_members',
        lastUpdated: new Date().toISOString(),
        skillsCount: Object.keys(member.skills || {}).length,
        isClaimed: !!member.supabase_user_id
      }
    });

  } catch (error) {
    console.error('Member detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 