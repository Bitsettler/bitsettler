import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';

/**
 * Skill Names API
 * 
 * Returns skill ID to name mappings cached from BitJita API
 * Used by frontend to display human-readable skill names instead of IDs
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🎓 Fetching skill names mapping...');

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable'
      }, { status: 500 });
    }

    // Fetch all skill names from cache
    const { data: skillNames, error } = await supabase
      .from('skills')
      .select('skill_id, skill_name')
      .order('skill_name');

    if (error) {
      console.error('Error fetching skill names:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch skill names'
      }, { status: 500 });
    }

    // Transform to ID→name mapping
    const skillMapping: Record<string, string> = {};
    (skillNames || []).forEach(skill => {
      skillMapping[skill.skill_id] = skill.skill_name;
    });

    console.log(`✅ Loaded ${Object.keys(skillMapping).length} skill names`);

    return NextResponse.json({
      success: true,
      data: {
        skillNames: skillMapping,
        count: Object.keys(skillMapping).length
      },
      meta: {
        dataSource: 'cached_skills',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Skill names API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}