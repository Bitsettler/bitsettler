import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { getMemberActivityInfo } from '@/lib/utils/member-activity';
import { MemberQueryParamsV2, MemberListResponseV2, SettlementMemberV2, legacyToMemberV2 } from '@/lib/types/settlement-member-v2';

/**
 * Settlement Members API V2
 * 
 * New API that demonstrates the architectural separation between 
 * settlement membership and activity status.
 * 
 * Phase 1: Testing alongside existing API
 * Phase 2: Replace existing members API
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse query parameters
  const params: MemberQueryParamsV2 = {
    settlement_id: searchParams.get('settlement_id') || '',
    include_former_members: searchParams.get('include_former_members') === 'true',
    activity_filter: searchParams.get('activity_filter') as any || 'all',
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
    profession_filter: searchParams.get('profession_filter') || undefined,
    permission_filter: searchParams.get('permission_filter') as any || 'all',
    claimed_only: searchParams.get('claimed_only') === 'true',
  };

  if (!params.settlement_id) {
    return NextResponse.json({
      success: false,
      error: 'settlement_id is required'
    }, { status: 400 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({
      success: false,
      error: 'Database service unavailable'
    }, { status: 500 });
  }

  try {
    // Use the new database view with computed activity fields
    let query = supabase
      .from('settlement_members_with_activity')
      .select('*')
      .eq('settlement_id', params.settlement_id);

    // Settlement membership filtering
    if (!params.include_former_members) {
      query = query.eq('is_active', true); // Only current settlement members
    }

    // Activity filtering (using computed fields from view)
    if (params.activity_filter !== 'all') {
      switch (params.activity_filter) {
        case 'recently_active':
          query = query.eq('recently_active', true);
          break;
        case 'inactive':
          query = query.eq('recently_active', false).not('activity_status', 'eq', 'never_logged_in');
          break;
        case 'never_logged_in':
          query = query.eq('activity_status', 'never_logged_in');
          break;
      }
    }

    // Other filters
    if (params.profession_filter && params.profession_filter !== 'all') {
      query = query.ilike('top_profession', `%${params.profession_filter}%`);
    }

    if (params.permission_filter !== 'all') {
      if (params.permission_filter === 'officers') {
        query = query.or('officer_permission.gt.0,co_owner_permission.gt.0');
      } else if (params.permission_filter === 'builders') {
        query = query.gt('build_permission', 0);
      }
    }

    if (params.claimed_only) {
      query = query.not('supabase_user_id', 'is', null);
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('settlement_members_with_activity')
      .select('*', { count: 'exact', head: true })
      .eq('settlement_id', params.settlement_id);

    if (countError) {
      throw countError;
    }

    // Apply pagination and get results
    const { data: members, error } = await query
      .range(params.offset, params.offset + params.limit - 1)
      .order('name');

    if (error) {
      throw error;
    }

    // Get analytics using the analytics view
    const { data: analytics, error: analyticsError } = await supabase
      .from('settlement_members_analytics')
      .select('*')
      .eq('settlement_id', params.settlement_id)
      .single();

    if (analyticsError) {
      console.warn('Analytics query failed:', analyticsError);
    }

    // Transform to V2 format
    const membersV2: SettlementMemberV2[] = (members || []).map(member => {
      // Add computed activity info
      const activityInfo = getMemberActivityInfo(member);
      
      return legacyToMemberV2({
        ...member,
        recently_active: activityInfo.isRecentlyActive,
        activity_status: activityInfo.activityStatus,
        days_since_login: activityInfo.daysSinceLogin,
      });
    });

    const response: MemberListResponseV2 = {
      members: membersV2,
      pagination: {
        total: totalCount || 0,
        limit: params.limit,
        offset: params.offset,
        has_more: (params.offset + params.limit) < (totalCount || 0),
      },
      analytics: {
        total_members: analytics?.active_members || 0,
        recently_active_members: analytics?.recently_active_members || 0,
        claimed_members: analytics?.claimed_members || 0,
        officers: analytics?.officers || 0,
        co_owners: analytics?.co_owners || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Members V2 API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch members'
    }, { status: 500 });
  }
}
