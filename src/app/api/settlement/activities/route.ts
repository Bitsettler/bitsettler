import { NextRequest } from 'next/server';
import { getRecentSettlementActivities, getRecentMemberActivities } from '@/lib/settlement/activity-tracker';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!settlementId) {
      return Response.json({ 
        success: false, 
        error: 'Settlement ID required' 
      }, { status: 400 });
    }
    const supabase = createServerClient();
    
    if (!supabase) return;
    
    const { data: members, error: membersError } = await supabase
        .from('settlement_members_memberships')
        .select('*, player_entity_id(*)')
        .eq('settlement_id', settlementId as any)

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch members' 
      }, { status: 500 });
    }
    
    const membersIdList = members?.map(m => m.player_entity_id?.id) || [];

    // Fetch both types of activities in parallel
    const [settlementActivities, memberActivities] = await Promise.all([
      getRecentSettlementActivities(settlementId, limit, membersIdList),
      getRecentMemberActivities(settlementId, limit, membersIdList)
    ]);
    
    return Response.json({ 
      success: true, 
      data: {
        settlement: {
          activities: settlementActivities,
          count: settlementActivities.length,
          type: 'settlement'
        },
        member: {
          activities: memberActivities,
          count: memberActivities.length,
          type: 'member'
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch activities' 
    }, { status: 500 });
  }
}
