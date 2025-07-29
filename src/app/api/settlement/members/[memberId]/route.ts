import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client';

// Helper function to determine top profession from skills
function getTopProfession(skills: Record<string, number>): string {
  if (!skills || Object.keys(skills).length === 0) return 'Unknown';
  
  const skillEntries = Object.entries(skills);
  const topSkill = skillEntries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  return topSkill[0];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    if (!settlementId) {
      return NextResponse.json(
        { error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    // Check local database first if Supabase is available
    if (supabase) {
      console.log(`🔍 Fetching member ${memberId} for settlement ${settlementId} from local database`);
      
      try {
        // Get member details from settlement_members table
        const { data: memberData, error: memberError } = await supabase
          .from('settlement_members')
          .select('*')
          .eq('settlement_id', settlementId)
          .eq('entity_id', memberId)
          .maybeSingle();

        if (memberError) {
          console.error('Member lookup error:', memberError);
          throw memberError;
        }

        if (!memberData) {
          console.log(`❌ Member ${memberId} not found in settlement_members table`);
          return NextResponse.json(
            { error: 'Member not found' },
            { status: 404 }
          );
        }

        // Get citizen/skills data from settlement_citizens table - join by username since entity_ids don't match
        const { data: citizenData, error: citizenError } = await supabase
          .from('settlement_citizens')
          .select('*')
          .eq('settlement_id', settlementId)
          .eq('user_name', memberData.user_name)
          .maybeSingle();

        if (citizenError) {
          console.warn('Citizen lookup error (member may not have skills data):', citizenError);
        }

        console.log(`✅ Found member ${memberData.user_name} in local database`);

        // Get cached skill names from database (no BitJita API call)
        const { data: skillNamesData } = await supabase
          .from('skill_names')
          .select('skill_id, skill_name');
        
        const skillNames: Record<string, string> = {};
        (skillNamesData || []).forEach(row => {
          skillNames[row.skill_id] = row.skill_name;
        });

        // Map profession ID to name using cached skill names
        const professionName = citizenData?.top_profession ? skillNames[citizenData.top_profession] || 'Unknown' : 'Unknown';

        // Transform skills from {skillId: level} to {skillName: level} using cached skill names
        const mappedSkills: Record<string, number> = {};
        if (citizenData?.skills) {
          Object.entries(citizenData.skills).forEach(([skillId, level]) => {
            const skillName = skillNames[skillId] || `Skill ${skillId}`;
            mappedSkills[skillName] = level as number;
          });
        }

        // Transform database result to API format, combining member and citizen data
        const formattedMember = {
          id: memberData.entity_id,
          name: memberData.user_name,
          entityId: memberData.entity_id,
          profession: professionName,
          totalSkillLevel: citizenData?.total_level || 0,
          totalXP: citizenData?.total_xp || 0,
          highestLevel: citizenData?.highest_level || 0,
          skills: mappedSkills,
          permissions: {
            inventory: memberData.inventory_permission,
            build: memberData.build_permission,
            officer: memberData.officer_permission,
            coOwner: memberData.co_owner_permission
          },
          lastLogin: memberData.last_login_timestamp,
          joinedAt: memberData.joined_settlement_at,
          isActive: memberData.is_active,
          lastSyncInfo: `Member: ${new Date(memberData.last_synced_at).toLocaleString()}${citizenData ? `, Skills: ${new Date(citizenData.last_synced_at).toLocaleString()}` : ''}`
        };

        return NextResponse.json({
          success: true,
          data: formattedMember,
          meta: {
            dataSource: 'settlement_tables_direct',
            lastUpdated: new Date().toISOString(),
            hasCitizenData: !!citizenData,
            skillsCount: citizenData?.skills ? Object.keys(citizenData.skills).length : 0
          }
        });

      } catch (dbError) {
        console.error('Local database query failed:', dbError);
        // Fall through to BitJita API fallback
      }
    }

    // No real-time API fallback - only serve from cached data
    console.log(`❌ Member ${memberId} not found in cached data`);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Member not found in cached data',
        meta: {
          dataSource: 'none',
          reason: supabase ? 'member_not_in_cache' : 'local_database_unavailable',
          message: 'Member data will be available after next sync cycle'
        }
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Member detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 