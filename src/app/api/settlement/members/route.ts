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

async function handleGetMembers(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const paramsResult = requireQueryParams(searchParams, 'settlementId');
    if (!paramsResult.success) {
      return NextResponse.json(paramsResult, { status: 400 });
    }
    
    const { settlementId } = paramsResult.data;

    if (!settlementId) {
      return NextResponse.json({
        success: false,
        error: 'Settlement ID is required'
      }, { status: 400 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable'
      }, { status: 500 });
    }

    const { data: members, error } = await supabase.rpc('fetch_players_by_claim_entity_id', { claim_id: settlementId });

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch members'
      }, { status: 500 });
    }

    if (members.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          settlementId,
          members: [],
          memberCount: 0,
          source: 'database',
          lastUpdated: new Date().toISOString()
        }
      });
    }

    const formattedMembers = members.map((member: any) => {
      const settlementPermission = member.settlements.find((s: any) => s.claimEntityId === settlementId);
      return {
        id: member.id,
        name: member.name || 'Unknown Player',
        primary_profession: member.primary_profession,
        secondary_profession: member.secondary_profession,
        highest_level: member.highest_level || 0,
        total_skills: member.total_skills || 0,
        total_level: member.total_level || 0,
        total_xp: member.total_xp || 0,
        last_login_timestamp: member.last_login_timestamp,
        joined_settlement_at: member.joined_settlement_at,
        inventory_permission: settlementPermission?.inventoryPermission || 0,
        build_permission: settlementPermission?.buildPermission || 0,
        officer_permission: settlementPermission?.officerPermission || 0,
        co_owner_permission: settlementPermission?.coOwnerPermission || 0,
        claim_settlement_id: member.claim_settlement_id,
        skills: member.skills || {},
        avatar_url: member.avatar_url ?? null,
      };
    });

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