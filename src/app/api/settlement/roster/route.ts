import { NextRequest, NextResponse } from 'next/server';
import { BitJitaAPI } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';

/**
 * Settlement Roster API
 * 
 * Fetches settlement member roster from BitJita API for settlement verification
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

    console.log(`👥 Fetching roster for settlement: ${settlementId}`);

    // Call BitJita API to get settlement roster
    const rosterResult = await BitJitaAPI.fetchSettlementRoster(settlementId);

    if (!rosterResult.success) {
      console.error('❌ BitJita roster fetch failed:', rosterResult.error);
      return NextResponse.json(
        { success: false, error: rosterResult.error || 'Failed to fetch settlement roster' },
        { status: 500 }
      );
    }

    const members = rosterResult.data?.members || [];
    console.log(`✅ Found ${members.length} members in settlement ${settlementId}`);

    // Transform BitJita member data to our format
    const formattedMembers = members.map((member: any) => ({
      id: member.entityId || member.playerEntityId,
      entity_id: member.entityId,
      player_entity_id: member.playerEntityId,
      claim_entity_id: member.claimEntityId,
      bitjita_user_id: member.playerEntityId, // Use playerEntityId as user identifier
      name: member.playerName || 'Unknown Player',
      settlement_id: settlementId,
      
      // Default skill data (BitJita roster doesn't include skills)
      skills: {},
      total_skills: 0,
      highest_level: 0,
      total_level: 0,
      total_xp: 0,
      top_profession: 'Unknown',
      
      // Permission data from BitJita
      inventory_permission: member.canAccessInventory ? 1 : 0,
      build_permission: member.canBuild ? 1 : 0,
      officer_permission: member.isOfficer ? 1 : 0,
      co_owner_permission: member.isCoOwner ? 1 : 0,
      
      // Timestamps
      last_login_timestamp: member.lastLoginTimestamp ? new Date(member.lastLoginTimestamp) : null,
      joined_settlement_at: member.joinedAt ? new Date(member.joinedAt) : null,
      
      // Status
      is_active: true,
      last_synced_at: new Date(),
      sync_source: 'bitjita_roster'
    }));

    return NextResponse.json({
      success: true,
      data: {
        settlementId,
        members: formattedMembers,
        memberCount: formattedMembers.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Settlement roster error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during roster fetch'
    }, { status: 500 });
  }
}