import { NextRequest, NextResponse } from 'next/server';
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
    
    const { data: members, error: membersError } = await supabase.rpc('fetch_players_by_claim_entity_id', { claim_id: settlementId });

    if (membersError) {
      console.error(`❌ Failed to fetch members:`, membersError);
      return NextResponse.json(
        { error: 'Failed to fetch settlement members' },
        { status: 500 }
      );
    }
  
    if (members.length === 0) {
      return Response.json({ 
        success: true, 
        data: {
          settlement: {
            activities: [],
            count: 0,
            type: 'settlement'
          },
          member: {
            activities: [],
            count: 0,
            type: 'member'
          }
        }
      });
    }

    const membersIdList = members?.map((m:any) => m.id);

    const [settlementActivities, memberActivities] = await Promise.all([
      getRecentSettlementActivities(limit, membersIdList),
      getRecentMemberActivities(limit, membersIdList)
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
