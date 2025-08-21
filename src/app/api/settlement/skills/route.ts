import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { logger } from '@/lib/logger';

interface SkillsAnalytics {
  totalSkills: number;
  averageLevel: number;
  totalSkillPoints: number;
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
    if (!settlementId) {
      return NextResponse.json({
        success: false,
        error: 'Settlement ID is required'
      }, { status: 400 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      logger.error('Supabase service client not available');
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable'
      }, { status: 500 });
    }

    const { data: members, error } = await supabase.rpc('fetch_players_by_claim_entity_id', { claim_id: settlementId });

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch members'
      }, { status: 500 });
    }

    if (members.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No members found'
      }, { status: 404 });
    }

    const totalMembers = members.length;
    const totalSkillPoints = members.reduce((sum: number, member: any) => sum + (member.total_xp || 0), 0);
    const averageLevel = totalMembers > 0 ? totalSkillPoints / totalMembers : 0;
    
    const skillAggregation: Record<string, { levels: number[]; members: Set<string> }> = {};
    
    members.forEach((member: any) => {
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
    
    const topSkills = Object.entries(skillAggregation)
      .map(([skillName, data]) => ({
        name: skillName,
        totalMembers: data.members.size,
        averageLevel: data.levels.reduce((sum, level) => sum + level, 0) / data.levels.length,
        maxLevel: Math.max(...data.levels)
      }))
      .sort((a, b) => b.totalMembers - a.totalMembers)
      .slice(0, 10);
    
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
      topSkills,
      skillLevelDistribution
    };

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