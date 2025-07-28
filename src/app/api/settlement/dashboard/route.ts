import { NextRequest, NextResponse } from 'next/server';
import { getSettlementDashboard } from '../../../../lib/spacetime-db-new/modules/settlements/flows/get-settlement-dashboard';
import { getTreasuryDashboard } from '../../../../lib/spacetime-db-new/modules/treasury/flows/get-treasury-dashboard';
import { getAllMembers } from '../../../../lib/spacetime-db-new/modules/settlements/commands/get-all-members';
import { supabase } from '../../../../lib/spacetime-db-new/shared/supabase-client';
import { BitJitaAPI } from '../../../../lib/spacetime-db-new/modules/integrations/bitjita-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    // Check local database first if we have a settlement ID and Supabase
    if (settlementId && supabase) {
      console.log(`🔍 Fetching settlement dashboard data for ${settlementId} from local database`);
      
      try {
        // Use getAllMembers with settlement filtering instead of direct queries
        const allMembers = await getAllMembers({ 
          includeInactive: false, 
          settlementId 
        });
        
        const allMembersIncludingInactive = await getAllMembers({ 
          includeInactive: true, 
          settlementId 
        });

        // Calculate stats from member data
        const totalMembers = allMembersIncludingInactive.length;
        const activeMembers = allMembers.filter(m => 
          m.lastOnline && 
          (Date.now() - m.lastOnline.getTime()) < (7 * 24 * 60 * 60 * 1000)
        ).length;

        // Calculate skill-based stats from members with profession data
        const membersWithSkills = allMembers.filter(m => m.professionLevel > 1);
        const totalSkillLevels = membersWithSkills.reduce((sum, member) => sum + member.professionLevel, 0);
        const avgSkillLevel = membersWithSkills.length > 0 ? Math.round(totalSkillLevels / membersWithSkills.length) : 0;

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
        if (!settlementId) {
          throw new Error('Settlement ID is required for BitJita API fallback');
        }
        
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
            fallbackReason: supabase ? 'local_database_error' : 'local_database_unavailable',
            avgSkillLevel
          }
        });

      } catch (error) {
        console.error('BitJita API error:', error);
        // Fall back to demo data if BitJita fails
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

    // Fetch dashboard data with graceful fallbacks for missing tables
    let settlementResult = null;
    let treasuryResult = null;

    try {
      settlementResult = await getSettlementDashboard(settlementId || undefined);
    } catch (error) {
      console.warn('Settlement dashboard unavailable (missing tables):', error instanceof Error ? error.message : error);
      settlementResult = {
        stats: { totalMembers: 0, activeMembers: 0, totalProjects: 0, completedProjects: 0 },
        meta: { dataSource: 'incomplete_schema', message: 'Settlement management tables not yet created' }
      };
    }

    try {
      treasuryResult = await getTreasuryDashboard();
    } catch (error) {
      console.warn('Treasury dashboard unavailable (missing tables):', error instanceof Error ? error.message : error);
      treasuryResult = {
        summary: null,
        stats: { monthlyIncome: 0, monthlyExpenses: 0, netChange: 0, transactionCount: 0, averageTransactionSize: 0 },
        meta: { dataSource: 'incomplete_schema', message: 'Treasury tables not yet created' }
      };
    }

    return NextResponse.json({
      settlement: settlementResult,
      treasury: treasuryResult,
      stats: {
        totalMembers: settlementResult?.stats?.totalMembers || 0,
        activeMembers: settlementResult?.stats?.activeMembers || 0,
        totalProjects: settlementResult?.stats?.totalProjects || 0,
        completedProjects: settlementResult?.stats?.completedProjects || 0,
        monthlyIncome: treasuryResult?.stats?.monthlyIncome || 0,
        monthlyExpenses: treasuryResult?.stats?.monthlyExpenses || 0,
        netChange: treasuryResult?.stats?.netChange || 0
      },
      meta: {
        dataSource: 'partial_data',
        lastUpdated: new Date().toISOString(),
        note: 'Some features unavailable - full database schema needed'
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 