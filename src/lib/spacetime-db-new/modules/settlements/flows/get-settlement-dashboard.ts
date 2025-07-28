import { getAllMembers, getSettlementInfo, getSettlementStats, type SettlementMember, type SettlementInfo, type SettlementStats } from '../commands';

export interface SettlementDashboard {
  settlementInfo: SettlementInfo | null;
  stats: SettlementStats;
  recentMembers: SettlementMember[];
  topProfessions: Array<{
    profession: string;
    count: number;
    members: SettlementMember[];
  }>;
}

/**
 * Get complete settlement dashboard data
 * Combines multiple commands to provide dashboard overview
 */
export async function getSettlementDashboard(settlementId?: string): Promise<SettlementDashboard> {
  try {
    // Fetch all data in parallel for better performance
    const [settlementInfo, stats, allMembers] = await Promise.all([
      getSettlementInfo(),
      getSettlementStats(),
      getAllMembers({ 
        includeInactive: false, 
        limit: 100,
        settlementId // Pass settlement context to filter members
      }),
    ]);

    // Get recent members (last 10 active members)
    const recentMembers = allMembers
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
      .slice(0, 10);

    // Calculate top professions
    const professionCounts = new Map<string, SettlementMember[]>();
    
    allMembers.forEach(member => {
      if (!professionCounts.has(member.profession)) {
        professionCounts.set(member.profession, []);
      }
      professionCounts.get(member.profession)!.push(member);
    });

    const topProfessions = Array.from(professionCounts.entries())
      .map(([profession, members]) => ({
        profession,
        count: members.length,
        members: members.sort((a, b) => b.professionLevel - a.professionLevel).slice(0, 5), // Top 5 in each profession
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 professions

    return {
      settlementInfo,
      stats,
      recentMembers,
      topProfessions,
    };

  } catch (error) {
    console.error('Error fetching settlement dashboard:', error);
    throw new Error('Failed to load settlement dashboard');
  }
} 