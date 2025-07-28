import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/spacetime-db-new/shared/supabase-client';

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
        // Get member details from the settlement_member_details view
        const { data: memberData, error } = await supabase
          .from('settlement_member_details')
          .select('*')
          .eq('settlement_id', settlementId)
          .eq('entity_id', memberId)
          .maybeSingle(); // Use maybeSingle() to handle case where no member is found

        if (error) {
          console.error('Local database search error:', error);
          throw error; // Fall through to BitJita API
        }

        if (memberData) {
          console.log(`✅ Found member ${memberData.user_name} in local database`);

          // Transform database result to API format
          const formattedMember = {
            id: memberData.entity_id,
            name: memberData.user_name,
            entityId: memberData.entity_id,
            profession: memberData.top_profession || 'Unknown',
            totalSkillLevel: memberData.total_level || 0,
            totalXP: memberData.total_xp || 0,
            highestLevel: memberData.highest_level || 0,
            skills: memberData.skills || {},
            permissions: {
              inventory: memberData.inventory_permission,
              build: memberData.build_permission,
              officer: memberData.officer_permission,
              coOwner: memberData.co_owner_permission
            },
            lastLogin: memberData.last_login_timestamp,
            joinedAt: memberData.joined_settlement_at,
            isActive: memberData.is_recently_active
          };

          return NextResponse.json({
            success: true,
            data: formattedMember,
            meta: {
              dataSource: 'local_database',
              lastUpdated: new Date().toISOString(),
              lastSyncInfo: `Last synced: ${new Date(memberData.last_synced_at).toLocaleString()}`
            }
          });
        }

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