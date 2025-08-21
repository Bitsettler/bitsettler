import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { logger } from '@/lib/logger';

interface SkillsAnalytics {
  totalSkills: number;
  averageLevel: number;
  totalSkillPoints: number;
  professionDistribution: Array<{
    profession: string;
    members: number;
    avgLevel: number;
    maxLevel: number;
  }>;
  topSkills: Array<{
    name: string;
    totalMembers: number;
    averageLevel: number;
    maxLevel: number;
  }>;
  skillLevelDistribution: Array<{
    levelRange: string;
    count: number;
  }>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const settlementId = searchParams.get('settlementId');

  try {
    console.log('🎓 Fetching settlement skills analytics from unified table...');

    const supabase = createServerClient();
    if (!supabase) {
      logger.error('Supabase service client not available');
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable'
      }, { status: 500 });
    }

    const { data: members, error } = await supabase.rpc('fetch_players_by_claim_entity_id', { claim_id: settlementId });

    // Calculate basic stats - data already aggregated!
    const totalMembers = members.length;
    const totalSkillPoints = members.reduce((sum: number, member: any) => sum + (member.total_xp || 0), 0);
    const totalSkillsCount = members.reduce((sum: number, member: any) => sum + (member.total_skills || 0), 0);
    const averageLevel = totalMembers > 0 ? totalSkillPoints / totalMembers : 0;


    // Calculate profession distribution
    const professionStats: Record<string, { count: number; levels: number[]; }> = {};
    members.forEach((member: any) => {
      const profession = member.profession;
      if (profession) {
        if (!professionStats[profession]) {
          professionStats[profession] = { count: 0, levels: [] };
        }
        professionStats[profession].count++;
        professionStats[profession].levels.push(member.highest_level || 0);
      } else {
        console.log('No profession found for member:', member);
      }
    });

    const professionDistribution = Object.entries(professionStats).map(([profession, stats]) => ({
      profession,
      members: stats.count,
      avgLevel: stats.levels.length > 0 ? stats.levels.reduce((sum, level) => sum + level, 0) / stats.levels.length : 0,
      maxLevel: stats.levels.length > 0 ? Math.max(...stats.levels) : 0
    })).sort((a, b) => b.members - a.members);

    // Aggregate individual skills - skills already in correct format!
    const skillAggregation: Record<string, { levels: number[]; members: Set<string> }> = {};
    
    members.forEach((member: any) => {
      // Skills are already in {skillName: level} format!
      const skills = member.skills || {};
      
      Object.entries(skills).forEach(([skillName, level]) => {
        if (typeof level === 'number' && level > 0) {
          if (!skillAggregation[skillName]) {
            skillAggregation[skillName] = { levels: [], members: new Set() };
          }
          skillAggregation[skillName].levels.push(level);
          skillAggregation[skillName].members.add(member.id);
        }
      });
    });

    // Calculate top skills
    const topSkills = Object.entries(skillAggregation)
      .map(([skillName, data]) => ({
        name: skillName,
        totalMembers: data.members.size,
        averageLevel: data.levels.reduce((sum, level) => sum + level, 0) / data.levels.length,
        maxLevel: Math.max(...data.levels)
      }))
      .sort((a, b) => b.totalMembers - a.totalMembers)
      .slice(0, 10);

    // Calculate skill level distribution - using pre-calculated highest_level
    const levelCounts = { '1-5': 0, '6-10': 0, '11-20': 0, '21+': 0 };
    members.forEach((member: any) => {
      const highestLevel = member.highest_level || 0;
      if (highestLevel >= 1 && highestLevel <= 5) levelCounts['1-5']++;
      else if (highestLevel >= 6 && highestLevel <= 10) levelCounts['6-10']++;
      else if (highestLevel >= 11 && highestLevel <= 20) levelCounts['11-20']++;
      else if (highestLevel >= 21) levelCounts['21+']++;
    });

    const skillLevelDistribution = Object.entries(levelCounts).map(([range, count]) => ({
      levelRange: range,
      count
    }));

    const analytics: SkillsAnalytics = {
      totalSkills: Object.keys(skillAggregation).length,
      averageLevel: Math.round(averageLevel * 10) / 10,
      totalSkillPoints,
      professionDistribution,
      topSkills,
      skillLevelDistribution
    };

    console.log(`✅ Skills analytics calculated:`, {
      totalMembers,
      totalSkills: analytics.totalSkills,
      averageLevel: analytics.averageLevel,
      dataSource: 'unified_settlement_members'
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        totalMembers,
        dataSource: 'unified_settlement_members',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (e) {
    console.error('Skills analytics error:', e);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 