import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase-server-auth';
import { createClient } from '@supabase/supabase-js';

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
    
    const { data: members, error: membersError } = await supabase.rpc('fetch_players_by_claim_entity_id', { claim_id: settlementId });

    if (membersError) {
      console.error(`❌ Failed to fetch members:`, membersError);
      return NextResponse.json(
        { error: 'Failed to fetch settlement members' },
        { status: 500 }
      );
    }

    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', settlementId as any)
      .single();


    if (settlementError) {
      console.warn(`⚠️ No settlement master data found:`, settlementError);
    }

    const typedMembers = members as any[] || [];
    const typedSettlement = settlement as any || {};

    // Calculate basic stats
    const activeMembers = typedMembers.length || 0; // Active settlement members only
    const totalMembers = typedMembers.length || 0; // Total members (active + inactive)

    const recentlyActiveMembers = typedMembers.filter(m => {
      if (!m.last_login_timestamp || m.last_login_timestamp === null) return false;
      try {
        const lastLogin = new Date(m.last_login_timestamp);
        // Check if date is valid
        if (isNaN(lastLogin.getTime())) return false;
        const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
        return lastLogin > weekAgo;
      } catch (error) {
        console.warn(`Invalid date for member ${m.name}: ${m.last_login_timestamp}`);
        return false;
      }
    }).length;


    // Get all member IDs for this settlement for project fetching
    const memberIds = typedMembers.map(m => m.id) || [];
    
    let projects: any[] = [];
    
    if (memberIds.length > 0) {
      // Use service role client for projects query to bypass RLS
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: projectsData, error: projectsErr } = await serviceSupabase
        .from('projects')
        .select('*')
        .in('created_by_player_id', memberIds);
      
      if (projectsErr) {
        console.error(`❌ Failed to fetch projects:`, projectsErr);
        // Don't fail the entire request, just log the error and use 0 for project stats
      }
      projects = projectsData || [];
    }

    const totalProjects = projects?.length || 0;
    const completedProjects = projects?.filter(p => p.status === 'Completed').length || 0;

    // Calculate skills insights
    const skillsInsights = {
      totalSkilledMembers: typedMembers.filter(m => m.total_level && m.total_level > 0).length || 0,
      avgSkillLevel: 0,
      topProfession: 'Settler',
      totalSkillPoints: 0,
      topSkills: [] as Array<{name: string, members: number, avgLevel: number}>
    };

    if (typedMembers.length > 0) {
      const skilledMembers = typedMembers.filter(m => m.total_level && m.total_level > 0);
      
      if (skilledMembers.length > 0) {
        skillsInsights.totalSkillPoints = skilledMembers.reduce((sum, m) => sum + (m.total_xp || 0), 0);
        skillsInsights.avgSkillLevel = skilledMembers.reduce((sum, m) => sum + (m.total_level || 0), 0) / skilledMembers.length;
        
        // Find most common profession
        const professionCounts = skilledMembers.reduce((counts, m) => {
          const prof = m.top_profession || 'Settler';
          counts[prof] = (counts[prof] || 0) + 1;
          return counts;
        }, {} as Record<string, number>);
        
        skillsInsights.topProfession = Object.entries(professionCounts)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Settler';
      }
    }

    // Treasury data from database only
    const currentBalance = typedSettlement?.treasury || 0;
    const treasuryDataSource = 'database';

    const treasuryData = {
      summary: {
        currentBalance,
        totalIncome: 0,
        totalExpenses: 0
      },
      stats: {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        netChange: 0,
        transactionCount: 0,
        averageTransactionSize: 0
      }
    };

    // Settlement info from database only
    const settlementInfo = {
      id: settlementId,
      name: typedSettlement?.name || 'Unknown Settlement',
      tier: typedSettlement?.tier || 1,
      treasury: currentBalance,
      region: typedSettlement?.region || 'Unknown'
    };

    const responseData = {
      settlement: {
        settlementInfo,
        // Settlement master data from our database (includes discord_link)
        masterData: settlement,
        stats: {
          totalMembers: activeMembers, // Show active members as the primary count on dashboard
          allMembers: totalMembers, // Keep total for reference
          recentlyActiveMembers,
          totalProjects,
          completedProjects,
          tiles: typedSettlement?.tiles || 0,
          supplies: typedSettlement?.supplies || 0
        }
      },
      treasury: treasuryData,
      stats: {
        totalMembers: activeMembers, // Show active members as the primary count on dashboard  
        allMembers: totalMembers, // Keep total for reference
        recentlyActiveMembers,
        totalProjects,
        completedProjects,
        currentBalance,
        monthlyIncome: 0,
        tiles: typedSettlement?.tiles || 0,
        supplies: typedSettlement?.supplies || 0
      },
      skills: skillsInsights,
      meta: {
        dataSource: 'supabase_database',
        treasuryDataSource,
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