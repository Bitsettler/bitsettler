import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/spacetime-db-new/shared/supabase-client';

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
    console.log('🎓 Fetching settlement skills analytics...');

    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database connection not available'
      }, { status: 503 });
    }

    // First, let's check what tables exist and have data
    console.log('🔍 Comprehensive database debugging...');
    
    // Check settlement_citizens table directly (where skills are actually stored)
    const { data: directCitizens, error: directCitizensError } = await supabase
      .from('settlement_citizens')
      .select('*')
      .eq('settlement_id', settlementId || '504403158277057776');
      
    console.log('🔍 Direct settlement_citizens query:', {
      count: directCitizens?.length || 0,
      error: directCitizensError,
      sample: directCitizens?.[0] || null
    });

    if (directCitizensError) {
      console.error('Error querying settlement_citizens:', directCitizensError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch skills data from settlement_citizens table'
      }, { status: 500 });
    }

    if (!directCitizens || directCitizens.length === 0) {
      console.log('🔍 No citizens found in settlement_citizens table');
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
        debug: {
          message: "No citizens found in settlement_citizens table",
          directCitizensCount: 0
        }
      });
    }

    // Get cached skill names from database (no BitJita API call)
    const { data: skillNamesData } = await supabase
      .from('skill_names')
      .select('skill_id, skill_name');
    
    const skillNames: Record<string, string> = {};
    (skillNamesData || []).forEach(row => {
      skillNames[row.skill_id] = row.skill_name;
    });

    // Use the citizens data directly (this has the real skills)
    const members = directCitizens;

    console.log(`📊 Using ${members.length} citizens directly from settlement_citizens table`);
    if (members.length > 0) {
      console.log(`🔍 Sample citizen data:`, {
        user_name: members[0].user_name,
        skills: members[0].skills,
        total_skills: members[0].total_skills,
        highest_level: members[0].highest_level,
        top_profession: members[0].top_profession,
        skillsType: typeof members[0].skills,
        allFields: Object.keys(members[0])
      });
    }

    // Calculate basic stats using correct field names from settlement_citizens table
    const totalMembers = members.length;
    const totalSkillPoints = members.reduce((sum, member) => sum + (member.total_xp || 0), 0);
    const totalSkillsCount = members.reduce((sum, member) => sum + (member.total_skills || 0), 0);
    const averageLevel = totalMembers > 0 ? totalSkillPoints / totalMembers : 0;

    // Find top profession using the correct field
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

    // Aggregate individual skills across all members
    const skillAggregation: Record<string, { levels: number[]; members: Set<string> }> = {};
    let totalUniqueSkills = 0;
    
    members.forEach(member => {
      // Parse skills from JSONB field 
      let skills: Record<string, number> = {};
      try {
        if (typeof member.skills === 'string') {
          skills = JSON.parse(member.skills);
        } else if (typeof member.skills === 'object' && member.skills !== null) {
          skills = member.skills;
        }
      } catch (e) {
        console.warn('Failed to parse skills for member:', member.entity_id);
        return;
      }

      Object.entries(skills).forEach(([skillId, level]) => {
        if (typeof level === 'number' && level > 0) {
          const skillName = skillNames[skillId] || `Skill ${skillId}`;
          if (!skillAggregation[skillName]) {
            skillAggregation[skillName] = { levels: [], members: new Set() };
          }
          skillAggregation[skillName].levels.push(level);
          skillAggregation[skillName].members.add(member.entity_id);
        }
      });
    });

    // Count unique skills found
    totalUniqueSkills = Object.keys(skillAggregation).length;

    // Calculate top skills
    const topSkills = Object.entries(skillAggregation)
      .map(([skillName, data]) => ({
        name: skillName,
        totalMembers: data.members.size,
        averageLevel: data.levels.reduce((sum, level) => sum + level, 0) / data.levels.length,
        maxLevel: Math.max(...data.levels)
      }))
      .sort((a, b) => b.totalMembers - a.totalMembers)
      .slice(0, 10); // Top 10 skills

    // Calculate skill level distribution based on highest skill level per member
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
      totalSkills: totalUniqueSkills,
      averageLevel: Math.round(averageLevel * 10) / 10, // Round to 1 decimal
      topProfession,
      totalSkillPoints,
      professionDistribution,
      topSkills,
      skillLevelDistribution
    };

    console.log(`✅ Skills analytics calculated:`, {
      totalMembers,
      totalSkills: totalUniqueSkills,
      totalSkillsInDB: totalSkillsCount,
      averageLevel: analytics.averageLevel,
      topProfession,
      professionsFound: professionDistribution.length,
      skillsFound: topSkills.length,
      sampleMember: members[0] ? {
        name: members[0].user_name,
        skills: members[0].skills,
        totalSkills: members[0].total_skills,
        highestLevel: members[0].highest_level
      } : null
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        totalMembers,
        dataSource: 'settlement_citizens_table',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Skills analytics error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 