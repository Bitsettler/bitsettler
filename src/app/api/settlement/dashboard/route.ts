import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase-server-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    console.log(`🔍 Dashboard API: Fetching data for settlement ${settlementId}`);

    if (!settlementId) {
      return NextResponse.json(
        { error: 'Settlement ID is required' },
        { status: 400 }
      );
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
      .eq('settlement_id', settlementId)
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
              .eq('settlement_id', settlementId);
              
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

    const responseData = {
      settlement: {
        settlementInfo: { 
          id: settlementId,
          name: settlement?.name || 'Unknown Settlement',
          tier: settlement?.tier || 1,
          region: settlement?.region || 'Unknown'
        },
        stats: {
          totalMembers,
          activeMembers,
          totalProjects: 0, // TODO: Add when projects table is ready
          completedProjects: 0
        }
      },
      treasury: treasuryData,
      stats: {
        totalMembers,
        activeMembers,
        totalProjects: 0,
        completedProjects: 0,
        currentBalance: currentBalance,
        monthlyIncome: 0
      },
      skills: skillsInsights,
      meta: {
        dataSource: 'supabase_database',
        treasuryDataSource,
        lastUpdated: new Date().toISOString(),
        settlementId
      }
    };

    console.log(`✅ Dashboard data compiled successfully:`, {
      totalMembers,
      activeMembers,
      skilledMembers: skillsInsights.totalSkilledMembers,
      treasury: currentBalance,
      treasurySource: treasuryDataSource
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