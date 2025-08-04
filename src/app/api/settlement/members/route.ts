import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { requireQueryParams } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

interface MemberData {
  settlementId: string;
  members: Array<{
    id: string;
    entity_id: string;
    player_entity_id: string | null;
    claim_entity_id: string | null;
    bitjita_user_id: string | null;
    name: string;
    settlement_id: string;
    skills: Record<string, number>;
    total_skills: number;
    highest_level: number;
    total_level: number;
    total_xp: number;
    top_profession: string;
    inventory_permission: number;
    build_permission: number;
    officer_permission: number;
    co_owner_permission: number;
    last_login_timestamp: string | null;
    joined_settlement_at: string | null;
    is_active: boolean;
    is_claimed: boolean;
    last_synced_at: string | null;
    sync_source: string | null;
  }>;
  memberCount: number;
  source: string;
  lastUpdated: string;
}

/**
 * Settlement Members API (Database Only)
 * 
 * Fetches settlement member data from OUR database (not BitJita)
 * This should be used after settlement establishment when data is already stored
 */
async function handleGetMembers(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate required parameters
    const paramsResult = requireQueryParams(searchParams, 'settlementId');
    if (!paramsResult.success) {
      return NextResponse.json(paramsResult, { status: 400 });
    }
    
    const { settlementId } = paramsResult.data;

    logger.info('Fetching settlement members from database', {
      settlementId,
      operation: 'GET_SETTLEMENT_MEMBERS'
    });

    // Get database client
    const supabase = createServerClient();
    if (!supabase) {
      logger.error('Supabase service client not available');
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable'
      }, { status: 500 });
    }

    console.log(`🔍 Members API: Querying settlement_members for settlement ${settlementId}`);
    
    const { data: members, error } = await supabase
    .from('settlement_members')
    .select(`
      id,
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
      sync_source,
      supabase_user_id
    `)
      .eq('settlement_id', settlementId);

    console.log(`📊 Members API: Found ${members?.length || 0} members in database`);

    if (error) {
      logger.error('Database query failed for settlement members', error, {
        settlementId,
        operation: 'GET_SETTLEMENT_MEMBERS'
      });
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch members from database'
      }, { status: 500 });
    }

    logger.info(`Successfully fetched ${members?.length || 0} members`, {
      settlementId,
      memberCount: members?.length || 0
    });

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
    is_claimed: !!member.supabase_user_id, // Boolean indicating if character is claimed
    last_synced_at: member.last_synced_at,
    sync_source: member.sync_source
    }));

    // Return data directly without double-wrapping to fix persistent members issue
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
    console.error('❌ Members API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = handleGetMembers;