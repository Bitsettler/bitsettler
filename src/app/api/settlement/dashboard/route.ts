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

    // Get Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Fetch settlement data from our database
    const { data: members, error: membersError } = await supabase
      .from('settlement_members')
      .select('*')
      .eq('settlement_id', settlementId);

    if (membersError) {
      console.error(`❌ Failed to fetch members:`, membersError);
      return NextResponse.json(
        { error: 'Failed to fetch settlement members' },
        { status: 500 }
      );
    }

    // Fetch settlement master data
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements_master')
      .select('*')
      .eq('id', settlementId)
      .single();

    if (settlementError) {
      console.warn(`⚠️ No settlement master data found:`, settlementError);
    }

    // Calculate basic stats
    const totalMembers = members?.length || 0;
    const activeMembers = members?.filter(m => {
      if (!m.last_login_timestamp) return false;
      const lastLogin = new Date(m.last_login_timestamp);
      const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
      return lastLogin > weekAgo;
    }).length || 0;

    // Get all member IDs for this settlement for project fetching
    const memberIds = members?.map(m => m.id) || [];
    
    let projects: any[] = [];
    let projectsError = null;
    
    if (memberIds.length > 0) {
      // Use service role client for projects query to bypass RLS
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: projectsData, error: projectsErr } = await serviceSupabase
        .from('settlement_projects')
        .select('*')
        .in('created_by_member_id', memberIds);
      
      projects = projectsData || [];
      projectsError = projectsErr;
    }

    if (projectsError) {
      console.error(`❌ Failed to fetch projects:`, projectsError);
      // Don't fail the entire request, just log the error and use 0 for project stats
    }

    const totalProjects = projects?.length || 0;
    const completedProjects = projects?.filter(p => p.status === 'Completed').length || 0;

    // Calculate skills insights
    const skillsInsights = {
      totalSkilledMembers: members?.filter(m => m.total_level && m.total_level > 0).length || 0,
      avgSkillLevel: 0,
      topProfession: 'Settler',
      totalSkillPoints: 0,
      topSkills: [] as Array<{name: string, members: number, avgLevel: number}>
    };

    if (members && members.length > 0) {
      const skilledMembers = members.filter(m => m.total_level && m.total_level > 0);
      
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
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Settler';
      }
    }

    // Treasury data from database only
    const currentBalance = settlement?.treasury || 0;
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
      name: settlement?.name || 'Unknown Settlement',
      tier: settlement?.tier || 1,
      treasury: currentBalance,
      region: settlement?.region || 'Unknown'
    };

    const responseData = {
      settlement: {
        settlementInfo,
        // Settlement master data from our database (includes discord_link)
        masterData: settlement,
        stats: {
          totalMembers,
          activeMembers,
          totalProjects,
          completedProjects,
          tiles: settlement?.tiles || 0,
          supplies: settlement?.supplies || 0
        }
      },
      treasury: treasuryData,
      stats: {
        totalMembers,
        activeMembers,
        totalProjects,
        completedProjects,
        currentBalance,
        monthlyIncome: 0,
        tiles: settlement?.tiles || 0,
        supplies: settlement?.supplies || 0
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