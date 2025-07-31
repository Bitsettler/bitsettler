import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';

interface SkillsAnalytics {
  totalSkills: number;
  averageLevel: number;
  topProfession: string;
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

    // Query the unified settlement_members table - much simpler!
    let query = supabase
      .from('settlement_members')
      .select('*')
      .eq('is_active', true);

    if (settlementId) {
      query = query.eq('settlement_id', settlementId);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('Error querying settlement_members:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch skills data'
      }, { status: 500 });
    }

    if (!members || members.length === 0) {
      console.log('🔍 No members found in settlement_members table');
      return NextResponse.json({
        success: true,
        data: {
          totalSkills: 0,
          averageLevel: 0,
          topProfession: 'Unknown',
          totalSkillPoints: 0,
          professionDistribution: [],
          topSkills: [],
          skillLevelDistribution: []
        },
        meta: {
          totalMembers: 0,
          dataSource: 'unified_settlement_members',
          generatedAt: new Date().toISOString()
        }
      });
    }

    console.log(`📊 Analyzing ${members.length} members from unified table`);

    // Calculate basic stats - data already aggregated!
    const totalMembers = members.length;
    const totalSkillPoints = members.reduce((sum, member) => sum + (member.total_xp || 0), 0);
    const totalSkillsCount = members.reduce((sum, member) => sum + (member.total_skills || 0), 0);
    const averageLevel = totalMembers > 0 ? totalSkillPoints / totalMembers : 0;

    // Find top profession - already calculated per member!
    const professionCounts: Record<string, number> = {};
    members.forEach(member => {
      const profession = member.top_profession || 'Unknown';
      professionCounts[profession] = (professionCounts[profession] || 0) + 1;
    });
    const topProfession = Object.entries(professionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Calculate profession distribution
    const professionStats: Record<string, { count: number; levels: number[]; }> = {};
    members.forEach(member => {
      const profession = member.top_profession || 'Unknown';
      if (!professionStats[profession]) {
        professionStats[profession] = { count: 0, levels: [] };
      }
      professionStats[profession].count++;
      professionStats[profession].levels.push(member.highest_level || 0);
    });

    const professionDistribution = Object.entries(professionStats).map(([profession, stats]) => ({
      profession,
      members: stats.count,
      avgLevel: stats.levels.length > 0 ? stats.levels.reduce((sum, level) => sum + level, 0) / stats.levels.length : 0,
      maxLevel: stats.levels.length > 0 ? Math.max(...stats.levels) : 0
    })).sort((a, b) => b.members - a.members);

    // Aggregate individual skills - skills already in correct format!
    const skillAggregation: Record<string, { levels: number[]; members: Set<string> }> = {};
    
    members.forEach(member => {
      // Skills are already in {skillName: level} format!
      const skills = member.skills || {};
      
      Object.entries(skills).forEach(([skillName, level]) => {
        if (typeof level === 'number' && level > 0) {
          if (!skillAggregation[skillName]) {
            skillAggregation[skillName] = { levels: [], members: new Set() };
          }
          skillAggregation[skillName].levels.push(level);
          skillAggregation[skillName].members.add(member.entity_id);
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
    members.forEach(member => {
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
      topProfession,
      totalSkillPoints,
      professionDistribution,
      topSkills,
      skillLevelDistribution
    };

    console.log(`✅ Skills analytics calculated:`, {
      totalMembers,
      totalSkills: analytics.totalSkills,
      averageLevel: analytics.averageLevel,
      topProfession,
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