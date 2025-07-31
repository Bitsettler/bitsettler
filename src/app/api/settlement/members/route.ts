import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';

/**
 * Settlement Members API (Database Only)
 * 
 * Fetches settlement member data from OUR database (not BitJita)
 * This should be used after settlement establishment when data is already stored
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    if (!settlementId) {
      return NextResponse.json(
        { success: false, error: 'settlementId is required' },
        { status: 400 }
      );
    }

    console.log(`👥 Fetching members from database for settlement: ${settlementId}`);

    const supabase = await createServerSupabaseClient();

    // Fetch members from our database where data was stored during establishment
    const { data: members, error } = await supabase
      .from('settlement_members')
      .select(`
        entity_id,
        player_entity_id,
        claim_entity_id,
        bitjita_user_id,
        name,
        settlement_id,
        skills,
        total_skills,
        highest_level,
        total_level,
        total_xp,
        top_profession,
        inventory_permission,
        build_permission,
        officer_permission,
        co_owner_permission,
        last_login_timestamp,
        joined_settlement_at,
        is_active,
        last_synced_at,
        sync_source
      `)
      .eq('settlement_id', settlementId)
      .eq('is_active', true)
      .is('supabase_user_id', null); // Only unclaimed characters

    if (error) {
      console.error('❌ Database query failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch members from database' },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${members?.length || 0} unclaimed members in database`);

    // Transform database data to frontend format
    const formattedMembers = (members || []).map((member) => ({
      id: member.entity_id,
      entity_id: member.entity_id,
      player_entity_id: member.player_entity_id,
      claim_entity_id: member.claim_entity_id,
      bitjita_user_id: member.bitjita_user_id,
      name: member.name || 'Unknown Player',
      settlement_id: member.settlement_id,
      
      // Skill data from database
      skills: member.skills || {},
      total_skills: member.total_skills || 0,
      highest_level: member.highest_level || 0,
      total_level: member.total_level || 0,
      total_xp: member.total_xp || 0,
      top_profession: member.top_profession || 'Unknown',
      
      // Permission data from database
      inventory_permission: member.inventory_permission || 0,
      build_permission: member.build_permission || 0,
      officer_permission: member.officer_permission || 0,
      co_owner_permission: member.co_owner_permission || 0,
      
      // Timestamps
      last_login_timestamp: member.last_login_timestamp,
      joined_settlement_at: member.joined_settlement_at,
      
      // Status
      is_active: member.is_active,
      last_synced_at: member.last_synced_at,
      sync_source: member.sync_source
    }));

    return NextResponse.json({
      success: true,
      data: {
        settlementId,
        members: formattedMembers,
        memberCount: formattedMembers.length,
        source: 'database',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Settlement members error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during member fetch'
    }, { status: 500 });
  }
}