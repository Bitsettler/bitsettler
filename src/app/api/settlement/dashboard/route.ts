import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase-server-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    if (!settlementId) {
      return NextResponse.json(
        { error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    
    const [membersResponse, settlementResponse] = await Promise.all([
      supabase.rpc('fetch_players_by_claim_entity_id', { claim_id: settlementId }),
      supabase.from('settlements').select('*').eq('id', settlementId as any).single()
    ]);

    if (membersResponse.error) {
      console.error(`❌ Failed to fetch members:`, membersResponse.error);
      return NextResponse.json(
        { error: 'Failed to fetch settlement members' },
        { status: 500 }
      );
    }

    if (settlementResponse.error) {
      console.warn(`⚠️ No settlement master data found:`, settlementResponse.error);
    }

    const members = membersResponse.data as any[] || [];
    const settlement = settlementResponse.data as any || {};

    // Calculate member stats efficiently
    const activeMembers = members.filter((m: any) => m.is_active).length;
    const recentlyActiveMembers = members.filter(m => {
      if (!m.last_login_timestamp) return false;
      try {
        const lastLogin = new Date(m.last_login_timestamp);
        if (isNaN(lastLogin.getTime())) return false;
        const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
        return lastLogin > weekAgo;
      } catch {
        console.warn(`Invalid date for member ${m.name}: ${m.last_login_timestamp}`);
        return false;
      }
    }).length;

    // Fetch project stats only if there are members
    let totalProjects = 0;
    let completedProjects = 0;
    
    if (members.length > 0) {
      const memberIds = members.map(m => m.id);
      const { data: projectsData, error: projectsErr } = await supabase
        .from('projects')
        .select('status')
        .in('created_by_player_id', memberIds);
      
      if (projectsErr) {
        console.error(`❌ Failed to fetch projects:`, projectsErr);
      } else if (projectsData) {
        totalProjects = projectsData.length;
        completedProjects = projectsData.filter((p: any) => p.status === 'Completed').length;
      }
    }

    // Basic settlement info
    const settlementInfo = {
      id: settlementId,
      name: settlement?.name || 'Unknown Settlement',
      tier: settlement?.tier || 1,
      region: settlement?.region_name || 'Unknown'
    };

    const responseData = {
      settlement,
      stats: {
        totalMembers: activeMembers,
        activeMembers,
        recentlyActiveMembers,
        totalProjects,
        completedProjects,
        currentBalance: settlement?.treasury || 0,
        monthlyIncome: 0,
        tiles: settlement?.tiles || 0,
        supplies: settlement?.supplies || 0
      },
      meta: {
        dataSource: 'supabase_database',
        lastUpdated: new Date().toISOString(),
        settlementId,
        liveDataAvailable: false
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}