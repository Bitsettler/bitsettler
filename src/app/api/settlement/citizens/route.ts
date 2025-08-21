import { NextRequest, NextResponse } from 'next/server';
import { BitJitaAPI } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';

/**
 * Settlement Citizens API
 * 
 * Fetches settlement citizen data with skills and levels from BitJita API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    if (!settlementId) {
      return NextResponse.json(
        { success: false, error: 'settlementId is required' },
        { status: 400 }
      );
    }

    console.log(`👥 Fetching citizens for settlement: ${settlementId}`);

    // Call BitJita API to get settlement citizens with character stats
    const citizensResult = await BitJitaAPI.fetchSettlementCitizens(settlementId);

    if (!citizensResult.success) {
      console.error('❌ BitJita citizens fetch failed:', citizensResult.error);
      return NextResponse.json(
        { success: false, error: citizensResult.error || 'Failed to fetch settlement citizens' },
        { status: 500 }
      );
    }

    const citizens = citizensResult.data?.citizens || [];
    const skillNames = citizensResult.data?.skillNames || {};
    console.log(`✅ Found ${citizens.length} citizens with character stats`);

    // Transform BitJita citizen data to our format
    const formattedCitizens = citizens.map((citizen: any) => ({
      entity_id: citizen.entityId,
      user_name: citizen.userName || 'Unknown Player', 
      name: citizen.userName || 'Unknown Player', // Add name field for consistency
      settlement_id: settlementId,
      
      // Real character stats from BitJita
      skills: citizen.skills || {},
      total_skills: citizen.totalSkills || 0,
      highest_level: citizen.highestLevel || 0,
      total_level: citizen.totalLevel || 0,
      total_xp: citizen.totalXP || 0,
            // Status
      source: 'bitjita_citizens'
    }));

    return NextResponse.json({
      success: true,
      data: {
        settlementId,
        citizens: formattedCitizens,
        skillNames,
        citizenCount: formattedCitizens.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Settlement citizens error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during citizens fetch'
    }, { status: 500 });
  }
}

/**
 * Calculate the top profession from skills
 */
function getTopProfession(skills: Record<string, number>, skillNames: Record<string, string>): string {
  if (!skills || Object.keys(skills).length === 0) {
    return 'Settler';
  }

  // Find the skill with the highest level
  const topSkillId = Object.entries(skills)
    .sort(([,a], [,b]) => b - a)
    .map(([skillId]) => skillId)[0];

  // Get the human-readable name for the skill
  const topSkillName = skillNames[topSkillId] || topSkillId;
  
  // Convert skill name to profession name (simple mapping)
  const professionMap: Record<string, string> = {
    'Farming': 'Farmer',
    'Mining': 'Miner',
    'Logging': 'Lumberjack',
    'Smithing': 'Blacksmith',
    'Cooking': 'Chef',
    'Building': 'Builder',
    'Tailoring': 'Tailor',
    'Alchemy': 'Alchemist'
  };

  return professionMap[topSkillName] || topSkillName || 'Settler';
}