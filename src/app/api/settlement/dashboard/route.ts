import { NextRequest, NextResponse } from 'next/server';
import { getSettlementDashboard } from '../../../../lib/spacetime-db-new/modules/settlements/flows/get-settlement-dashboard';
import { getTreasuryDashboard } from '../../../../lib/spacetime-db-new/modules/treasury/flows/get-treasury-dashboard';
import { getTreasurySummary, getTreasuryStats } from '../../../../lib/spacetime-db-new/modules';
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

        // Calculate skills insights from settlement_citizens table
        const { data: citizensData } = await supabase
          .from('settlement_citizens')
          .select('*')
          .eq('settlement_id', settlementId);

        // Get cached skill names
        const { data: skillNamesData } = await supabase
          .from('skill_names')
          .select('skill_id, skill_name');
        
        const skillNames: Record<string, string> = {};
        (skillNamesData || []).forEach(row => {
          skillNames[row.skill_id] = row.skill_name;
        });

        let skillsInsights = {
          totalSkilledMembers: 0,
          avgSkillLevel: 0,
          topProfession: 'Unknown',
          totalSkillPoints: 0,
          topSkills: [] as Array<{name: string, members: number, avgLevel: number}>
        };

        if (citizensData && citizensData.length > 0) {
          const skilledMembers = citizensData.filter(c => c.total_skills > 0);
          skillsInsights.totalSkilledMembers = skilledMembers.length;
          
          if (skilledMembers.length > 0) {
            skillsInsights.totalSkillPoints = skilledMembers.reduce((sum, m) => sum + (m.total_xp || 0), 0);
            skillsInsights.avgSkillLevel = Math.round(
              skilledMembers.reduce((sum, m) => sum + (m.highest_level || 0), 0) / skilledMembers.length
            );

            // Find top profession
            const professionCounts: Record<string, number> = {};
            skilledMembers.forEach(member => {
              const profession = skillNames[member.top_profession] || 'Unknown';
              professionCounts[profession] = (professionCounts[profession] || 0) + 1;
            });
            
            skillsInsights.topProfession = Object.entries(professionCounts)
              .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

            // Calculate top skills
            const skillStats: Record<string, {members: number, totalLevels: number}> = {};
            skilledMembers.forEach(member => {
              if (member.skills) {
                Object.entries(member.skills).forEach(([skillId, level]) => {
                  const skillName = skillNames[skillId] || `Skill ${skillId}`;
                  if (!skillStats[skillName]) {
                    skillStats[skillName] = {members: 0, totalLevels: 0};
                  }
                  skillStats[skillName].members += 1;
                  skillStats[skillName].totalLevels += (level as number);
                });
              }
            });

            skillsInsights.topSkills = Object.entries(skillStats)
              .map(([name, stats]) => ({
                name,
                members: stats.members,
                avgLevel: Math.round(stats.totalLevels / stats.members)
              }))
              .sort((a, b) => b.members - a.members)
              .slice(0, 5);
          }
        }

        console.log(`✅ Found dashboard data: ${totalMembers} members, ${activeMembers} active, ${skillsInsights.totalSkilledMembers} skilled`);

        // Get treasury data with BitJita integration
        let treasuryResult = null;
        try {
          console.log('🏛️ Fetching treasury with BitJita integration for dashboard...');
          
          // Get local treasury data
          const [localSummary, treasuryStats] = await Promise.all([
            getTreasurySummary(),
            getTreasuryStats(),
          ]);

          // Fetch real treasury balance from BitJita if we have settlement ID
          let enhancedSummary = localSummary;
          let dataSource = 'local_database';
          
          if (settlementId) {
            const bitjitaResult = await BitJitaAPI.fetchSettlementDetails(settlementId);
            
            if (bitjitaResult.success && bitjitaResult.data) {
              console.log(`✅ Using BitJita treasury balance: ${bitjitaResult.data.treasury}`);
              if (enhancedSummary) {
                enhancedSummary.currentBalance = bitjitaResult.data.treasury;
              } else {
                enhancedSummary = {
                  id: 'default',
                  currentBalance: bitjitaResult.data.treasury,
                  totalIncome: 0,
                  totalExpenses: 0,
                  lastTransactionDate: null,
                  lastUpdated: new Date(),
                  createdAt: new Date()
                };
              }
              dataSource = 'bitjita_realtime';
            } else {
              console.warn(`⚠️ Failed to fetch BitJita balance: ${bitjitaResult.error}`);
            }
          }

          treasuryResult = {
            summary: enhancedSummary,
            stats: treasuryStats,
            meta: { dataSource, lastUpdated: new Date().toISOString() }
          };
          
          console.log(`📊 Treasury: Current Balance: ${enhancedSummary?.currentBalance || 0}`);
        } catch (error) {
          console.warn('Treasury integration failed:', error instanceof Error ? error.message : error);
          treasuryResult = {
            summary: null,
            stats: { monthlyIncome: 0, monthlyExpenses: 0, netChange: 0, transactionCount: 0, averageTransactionSize: 0 },
            meta: { dataSource: 'error', message: 'Treasury unavailable' }
          };
        }

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
          treasury: treasuryResult,
          stats: {
            totalMembers,
            activeMembers,
            totalProjects: 0,
            completedProjects: 0,
            currentBalance: treasuryResult?.summary?.currentBalance || 0,
            monthlyIncome: treasuryResult?.stats?.monthlyIncome || 0
          },
          skills: skillsInsights,
          meta: {
            dataSource: 'local_database_with_treasury',
            lastUpdated: new Date().toISOString(),
            settlementId
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
        const skillNames = citizensResult.success ? citizensResult.data?.skillNames || {} : {};
        
        // Calculate stats from real data
        const totalMembers = members.length;
        const activeMembers = members.filter(m => 
          m.lastLoginTimestamp && 
          (Date.now() - new Date(m.lastLoginTimestamp).getTime()) < (7 * 24 * 60 * 60 * 1000) // Active in last 7 days
        ).length;
        
        // Calculate skills insights from BitJita data
        let skillsInsights = {
          totalSkilledMembers: 0,
          avgSkillLevel: 0,
          topProfession: 'Unknown',
          totalSkillPoints: 0,
          topSkills: [] as Array<{name: string, members: number, avgLevel: number}>
        };

        if (citizens && citizens.length > 0) {
          const skilledMembers = citizens.filter(c => c.totalLevel > 0);
          skillsInsights.totalSkilledMembers = skilledMembers.length;
          
          if (skilledMembers.length > 0) {
            skillsInsights.totalSkillPoints = skilledMembers.reduce((sum, m) => sum + (m.totalXP || 0), 0);
            skillsInsights.avgSkillLevel = Math.round(
              skilledMembers.reduce((sum, m) => sum + (m.highestLevel || 0), 0) / skilledMembers.length
            );

            // Find top profession by calculating the highest skill for each member
            const professionCounts: Record<string, number> = {};
            skilledMembers.forEach(member => {
              let topSkillId = '';
              let topSkillLevel = 0;
              
              // Find the skill with highest level for this member
              Object.entries(member.skills || {}).forEach(([skillId, level]) => {
                if (level > topSkillLevel) {
                  topSkillLevel = level;
                  topSkillId = skillId;
                }
              });
              
              const profession = skillNames[topSkillId] || 'Unknown';
              professionCounts[profession] = (professionCounts[profession] || 0) + 1;
            });
            
            skillsInsights.topProfession = Object.entries(professionCounts)
              .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

            // Calculate top skills
            const skillStats: Record<string, {members: number, totalLevels: number}> = {};
            skilledMembers.forEach(member => {
              if (member.skills) {
                Object.entries(member.skills).forEach(([skillId, level]) => {
                  const skillName = skillNames[skillId] || `Skill ${skillId}`;
                  if (!skillStats[skillName]) {
                    skillStats[skillName] = {members: 0, totalLevels: 0};
                  }
                  skillStats[skillName].members += 1;
                  skillStats[skillName].totalLevels += (level as number);
                });
              }
            });

            skillsInsights.topSkills = Object.entries(skillStats)
              .map(([name, stats]) => ({
                name,
                members: stats.members,
                avgLevel: Math.round(stats.totalLevels / stats.members)
              }))
              .sort((a, b) => b.members - a.members)
              .slice(0, 5);
          }
        }

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
          skills: skillsInsights,
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
        skills: {
          totalSkilledMembers: 0,
          avgSkillLevel: 0,
          topProfession: 'Unknown',
          totalSkillPoints: 0,
          topSkills: []
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
      console.log('🏛️ Fetching treasury with BitJita integration for dashboard...');
      
      // Get local treasury data
      const [localSummary, stats] = await Promise.all([
        getTreasurySummary(),
        getTreasuryStats(),
      ]);

      // Fetch real treasury balance from BitJita if we have settlement ID
      let enhancedSummary = localSummary;
      let dataSource = 'local_database';
      
      if (settlementId) {
        const bitjitaResult = await BitJitaAPI.fetchSettlementDetails(settlementId);
        
                 if (bitjitaResult.success && bitjitaResult.data) {
           console.log(`✅ Using BitJita treasury balance: ${bitjitaResult.data.treasury}`);
           if (enhancedSummary) {
             enhancedSummary.currentBalance = bitjitaResult.data.treasury;
           }
           dataSource = 'bitjita_realtime';
         } else {
           console.warn(`⚠️ Failed to fetch BitJita balance: ${bitjitaResult.error}`);
         }
      }

      treasuryResult = {
        summary: enhancedSummary,
        stats,
        recentTransactions: [],
        categories: [],
        monthlyBreakdown: { income: [], expenses: [] },
        meta: { dataSource, lastUpdated: new Date().toISOString() }
      };
      
      console.log(`📊 Treasury: Current Balance: ${enhancedSummary?.currentBalance || 0}`);
    } catch (error) {
      console.warn('Treasury dashboard unavailable:', error instanceof Error ? error.message : error);
      treasuryResult = {
        summary: null,
        stats: { monthlyIncome: 0, monthlyExpenses: 0, netChange: 0, transactionCount: 0, averageTransactionSize: 0 },
        meta: { dataSource: 'incomplete_schema', message: 'Treasury unavailable' }
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
        currentBalance: treasuryResult?.summary?.currentBalance || 0,
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