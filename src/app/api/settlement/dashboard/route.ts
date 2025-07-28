import { NextRequest, NextResponse } from 'next/server';
import { getSettlementDashboard } from '../../../../lib/spacetime-db-new/modules/settlements/flows/get-settlement-dashboard';
import { getTreasuryDashboard } from '../../../../lib/spacetime-db-new/modules/treasury/flows/get-treasury-dashboard';
import { supabase } from '../../../../lib/spacetime-db-new/shared/supabase-client';
import { BitJitaAPI } from '../../../../lib/spacetime-db-new/modules/integrations/bitjita-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    // Check local database first if we have a settlement ID and Supabase
    if (settlementId) {
      if (supabase) {
        console.log(`🔍 Fetching settlement dashboard data for ${settlementId} from local database`);
        
        try {
          // Get member stats from local database
          const { data: memberStats, error: memberError } = await supabase
            .from('settlement_members')
            .select('last_login_timestamp, is_active')
            .eq('settlement_id', settlementId)
            .eq('is_active', true);

          // Get citizen stats from local database
          const { data: citizenStats, error: citizenError } = await supabase
            .from('settlement_citizens')
            .select('total_level, total_xp, highest_level')
            .eq('settlement_id', settlementId);

          if (memberError || citizenError) {
            console.error('Database error:', memberError || citizenError);
            throw new Error('Database query failed');
          }

          // Calculate stats from cached data
          const totalMembers = memberStats?.length || 0;
          const activeMembers = memberStats?.filter(m => 
            m.last_login_timestamp && 
            (Date.now() - new Date(m.last_login_timestamp).getTime()) < (7 * 24 * 60 * 60 * 1000)
          ).length || 0;

          // Calculate skill-based stats
          const totalSkillLevels = citizenStats?.reduce((sum, citizen) => sum + (citizen.total_level || 0), 0) || 0;
          const avgSkillLevel = citizenStats && citizenStats.length > 0 ? Math.round(totalSkillLevels / citizenStats.length) : 0;

          console.log(`✅ Found dashboard data: ${totalMembers} members, ${activeMembers} active`);

          return NextResponse.json({
            settlement: {
              settlementInfo: { id: settlementId },
              stats: {
                totalMembers,
                activeMembers,
                totalProjects: 0, // Will be available when projects API is implemented
                completedProjects: 0,
              }
            },
            treasury: {
              summary: null,
              stats: {
                currentBalance: 0, // Will be available with treasury integration
                monthlyIncome: 0,
                monthlyExpenses: 0,
                netChange: 0
              }
            },
            stats: {
              totalMembers,
              activeMembers,
              totalProjects: 0,
              completedProjects: 0,
              currentBalance: 0,
              monthlyIncome: 0
            },
            meta: {
              dataSource: 'local_database',
              lastUpdated: new Date().toISOString(),
              settlementId,
              avgSkillLevel
            }
          });

        } catch (dbError) {
          console.error('Local database query failed:', dbError);
          // Fall through to BitJita API fallback
        }
      }

      // Fallback to BitJita API if local database is unavailable or fails
      if (!supabase || settlementId) {
        console.log(`🌐 Falling back to BitJita API for settlement ${settlementId} dashboard data`);
        
        try {
          const [rosterResult, citizensResult] = await Promise.all([
            BitJitaAPI.fetchSettlementRoster(settlementId),
            BitJitaAPI.fetchSettlementCitizens(settlementId)
          ]);

          const members = rosterResult.success ? rosterResult.data?.members || [] : [];
          const citizens = citizensResult.success ? citizensResult.data?.citizens || [] : [];
          
          // Calculate stats from real data
          const totalMembers = members.length;
          const activeMembers = members.filter(m => 
            m.lastLoginTimestamp && 
            (Date.now() - new Date(m.lastLoginTimestamp).getTime()) < (7 * 24 * 60 * 60 * 1000) // Active in last 7 days
          ).length;
          
          // Calculate skill-based stats
          const totalSkillLevels = citizens.reduce((sum, citizen) => sum + citizen.totalLevel, 0);
          const avgSkillLevel = citizens.length > 0 ? Math.round(totalSkillLevels / citizens.length) : 0;

          return NextResponse.json({
            settlement: {
              settlementInfo: { id: settlementId },
              stats: {
                totalMembers,
                activeMembers,
                totalProjects: 0, // Will be available when projects API is implemented
                completedProjects: 0,
              }
            },
            treasury: {
              summary: null,
              stats: {
                currentBalance: 0, // Will be available with treasury integration
                monthlyIncome: 0,
                monthlyExpenses: 0,
                netChange: 0
              }
            },
            stats: {
              totalMembers,
              activeMembers,
              totalProjects: 0,
              completedProjects: 0,
              currentBalance: 0,
              monthlyIncome: 0
            },
            meta: {
              dataSource: 'bitjita_api_fallback',
              lastUpdated: new Date().toISOString(),
              settlementId,
              fallbackReason: supabase ? 'local_database_error' : 'local_database_unavailable'
            }
          });

        } catch (error) {
          console.error('BitJita API error:', error);
          // Fall back to demo data if BitJita fails
        }
      }
    }

    if (!supabase) {

      // Return minimal data structure for demo mode
      return NextResponse.json({
        settlement: null,
        treasury: null,
        stats: {
          totalMembers: 0,
          activeMembers: 0,
          totalProjects: 0,
          completedProjects: 0,
          currentBalance: 0,
          monthlyIncome: 0
        },
        meta: {
          dataSource: 'demo_mode',
          lastUpdated: new Date().toISOString()
        }
      });
    }

    // Fetch dashboard data
    const [settlementResult, treasuryResult] = await Promise.all([
      getSettlementDashboard(),
      getTreasuryDashboard()
    ]);

    return NextResponse.json({
      settlement: settlementResult,
      treasury: treasuryResult,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 