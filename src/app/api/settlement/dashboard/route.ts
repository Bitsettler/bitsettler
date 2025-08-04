import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase-server-auth';
import { BitJitaAPI } from '../../../../lib/spacetime-db-new/modules/integrations/bitjita-api';
import { settlementConfig } from '../../../../config/settlement-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    console.log(`🔍 Dashboard API: Fetching live data for settlement ${settlementId}`);

    if (!settlementId) {
      return NextResponse.json(
        { error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    // Fetch live settlement claim data from BitJita API
    console.log(`📡 Fetching live settlement claim data from BitJita...`);
    const claimResponse = await BitJitaAPI.fetchSettlementDetails(settlementId);
    
    let liveSettlementData = null;
    if (claimResponse.success) {
      liveSettlementData = claimResponse.data!;
      console.log(`✅ Live settlement data:`, liveSettlementData);
    } else {
      console.warn(`⚠️ Failed to fetch live settlement data, falling back to database:`, claimResponse.error);
    }

    // Get Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Fetch settlement data from our database
    console.log(`📊 Querying settlement_members for settlement ${settlementId}...`);
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

    console.log(`👥 Found ${members?.length || 0} members in database`);

    // Fetch settlement master data
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements_master')
      .select('*')
      .eq('id', settlementId)
      .single();

    if (settlementError) {
      console.warn(`⚠️ No settlement master data found:`, settlementError);
    } else {
      console.log(`🏛️ Settlement master data:`, {
        name: settlement?.name,
        treasury: settlement?.treasury,
        tier: settlement?.tier,
        region: settlement?.region
      });
    }

    // Calculate basic stats
    const totalMembers = members?.length || 0;
    const activeMembers = members?.filter(m => {
      if (!m.last_login_timestamp) return false;
      const lastLogin = new Date(m.last_login_timestamp);
      const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
      return lastLogin > weekAgo;
    }).length || 0;

    // Fetch project statistics
    console.log(`📊 Querying settlement_projects for settlement ${settlementId}...`);
    const { data: projects, error: projectsError } = await supabase
      .from('settlement_projects')
      .select(`
        *,
        created_by_member:settlement_members!created_by_member_id(settlement_id)
      `)
      .eq('created_by_member.settlement_id', settlementId);

    if (projectsError) {
      console.error(`❌ Failed to fetch projects:`, projectsError);
      // Don't fail the entire request, just log the error and use 0 for project stats
    }

    const totalProjects = projects?.length || 0;
    const completedProjects = projects?.filter(p => p.status === 'Completed').length || 0;
    console.log(`📈 Project stats: ${totalProjects} total, ${completedProjects} completed`);

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

    // Treasury data with real-time BitJita fallback
    let currentBalance = settlement?.treasury || 0;
    let treasuryDataSource = 'database';
    
    // If treasury is 0 in database, fetch real-time from BitJita as fallback
    if (currentBalance === 0) {
      console.log(`💰 Treasury is 0 in database, fetching real-time from BitJita...`);
      try {
        const searchResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settlement/search?q=${encodeURIComponent(settlement?.name || 'unknown')}`);
        const searchResult = await searchResponse.json();
        
        if (searchResult.success && searchResult.data?.settlements?.length > 0) {
          const bitjitaSettlement = searchResult.data.settlements.find((s: any) => s.id === settlementId);
          if (bitjitaSettlement && bitjitaSettlement.treasury > 0) {
            currentBalance = bitjitaSettlement.treasury;
            treasuryDataSource = 'bitjita_realtime';
            console.log(`✅ Using real-time BitJita treasury: ${currentBalance}`);
            
            // Optional: Update database with real value for future
            const { error: updateError } = await supabase
              .from('settlements_master')
              .update({ 
                treasury: currentBalance,
                last_synced_at: new Date().toISOString(),
                sync_source: 'realtime_fallback'
              })
              .eq('id', settlementId);
              
            if (updateError) {
              console.warn('⚠️ Failed to update treasury in database:', updateError);
            } else {
              console.log(`✅ Updated database treasury to ${currentBalance}`);
            }
          }
        }
      } catch (treasuryError) {
        console.warn('⚠️ Failed to fetch real-time treasury:', treasuryError);
      }
    }

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

    // Use live settlement data if available, otherwise fall back to database
    const settlementInfo = liveSettlementData ? {
      id: liveSettlementData.id,
      name: liveSettlementData.name,
      tier: liveSettlementData.tier,
      treasury: liveSettlementData.treasury,
      supplies: liveSettlementData.supplies,
      tiles: liveSettlementData.tiles,
      population: liveSettlementData.population
    } : {
      id: settlementId,
      name: settlement?.name || 'Unknown Settlement',
      tier: settlement?.tier || 1,
      region: settlement?.region || 'Unknown'
    };

    const responseData = {
      settlement: {
        settlementInfo,
        stats: {
          totalMembers, // Always use actual member count from database
          activeMembers,
          totalProjects,
          completedProjects,
          tiles: liveSettlementData?.tiles || 0,
          supplies: liveSettlementData?.supplies || 0
        }
      },
      treasury: treasuryData,
      stats: {
        totalMembers, // Always use actual member count from database
        activeMembers,
        totalProjects,
        completedProjects,
        currentBalance: liveSettlementData?.treasury || currentBalance,
        monthlyIncome: 0,
        tiles: liveSettlementData?.tiles || 0,
        supplies: liveSettlementData?.supplies || 0
      },
      skills: skillsInsights,
      meta: {
        dataSource: liveSettlementData ? 'bitjita_api_live' : 'supabase_database',
        treasuryDataSource,
        lastUpdated: new Date().toISOString(),
        settlementId,
        liveDataAvailable: !!liveSettlementData
      }
    };

    console.log(`✅ Dashboard data compiled successfully:`, {
      totalMembers: totalMembers, // Actual member count from database
      activeMembers,
      skilledMembers: skillsInsights.totalSkilledMembers,
      treasury: liveSettlementData?.treasury || currentBalance,
      treasurySource: treasuryDataSource,
      tiles: liveSettlementData?.tiles || 0,
      note: 'BitJita population field represents tile usage, not member count'
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}