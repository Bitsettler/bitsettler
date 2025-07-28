import { NextRequest, NextResponse } from 'next/server';
import { getAllMembers, type GetAllMembersOptions } from '../../../../lib/spacetime-db-new/modules';
import { supabase } from '../../../../lib/spacetime-db-new/shared/supabase-client';
import { BitJitaAPI } from '../../../../lib/spacetime-db-new/modules/integrations/bitjita-api';

// Helper function to determine top profession from skills
function getTopProfession(skills: Record<string, number>): string {
  if (!skills || Object.keys(skills).length === 0) return 'Unknown';
  
  const skillEntries = Object.entries(skills);
  const topSkill = skillEntries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  return topSkill[0];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const settlementId = searchParams.get('settlementId');
    
    // Parse query parameters
    const options: GetAllMembersOptions = {
      includeInactive: searchParams.get('includeInactive') === 'true',
      profession: searchParams.get('profession') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

        // Check local database first if we have a settlement ID
    if (settlementId) {
      if (supabase) {
        console.log(`🔍 Fetching member data for settlement ${settlementId} from local database`);
        
        try {
          // Use the settlement_member_details view for combined data
          let query = supabase
            .from('settlement_member_details')
            .select('*', { count: 'exact' })
            .eq('settlement_id', settlementId);

          // Apply filters
          if (options.profession && options.profession !== 'all') {
            query = query.ilike('top_profession', `%${options.profession}%`);
          }
          
          if (!options.includeInactive) {
            query = query.eq('is_recently_active', true);
          }

          // Apply pagination
          const offset = options.offset || 0;
          const limit = options.limit || 20;
          query = query.range(offset, offset + limit - 1);

          const { data: members, error, count } = await query;

          if (error) {
            console.error('Local database search error:', error);
            throw error; // Fall through to BitJita API
          }

          console.log(`✅ Found ${members?.length || 0} members in local database`);

          // Transform database results to API format
          const formattedMembers = (members || []).map(member => ({
            id: member.entity_id,
            name: member.user_name,
            entityId: member.entity_id,
            profession: member.top_profession || 'Unknown',
            totalSkillLevel: member.total_level || 0,
            totalXP: member.total_xp || 0,
            highestLevel: member.highest_level || 0,
            skills: member.skills || {},
            permissions: {
              inventory: member.inventory_permission,
              build: member.build_permission,
              officer: member.officer_permission,
              coOwner: member.co_owner_permission
            },
            lastLogin: member.last_login_timestamp,
            joinedAt: member.joined_settlement_at,
            isActive: member.is_recently_active
          }));

          return NextResponse.json({
            success: true,
            data: formattedMembers,
            count: formattedMembers.length,
            total: count || 0,
            pagination: {
              limit: options.limit,
              offset: options.offset,
              hasMore: (count || 0) > (offset + formattedMembers.length)
            },
            meta: {
              dataSource: 'local_database',
              lastUpdated: new Date().toISOString(),
              settlementId,
              lastSyncInfo: members && members.length > 0 
                ? `Last synced: ${new Date(members[0].last_synced_at).toLocaleString()}`
                : null
            }
          });

        } catch (dbError) {
          console.error('Local database query failed:', dbError);
          // Fall through to BitJita API fallback
        }
      }

      // Fallback to BitJita API if local database is unavailable or fails
      console.log(`🌐 Falling back to BitJita API for settlement ${settlementId} member data`);
      
      try {
        const [rosterResult, citizensResult] = await Promise.all([
          BitJitaAPI.fetchSettlementRoster(settlementId),
          BitJitaAPI.fetchSettlementCitizens(settlementId)
        ]);

        let members: any[] = [];
        
        if (rosterResult.success && citizensResult.success) {
          const roster = rosterResult.data?.members || [];
          const citizens = citizensResult.data?.citizens || [];
          
          // Combine roster and citizen data
          members = roster.map(member => {
            const citizen = citizens.find(c => c.userName === member.userName);
            
            return {
              id: member.entityId,
              name: member.userName,
              entityId: member.entityId,
              profession: citizen ? getTopProfession(citizen.skills) : 'Unknown',
              totalSkillLevel: citizen?.totalLevel || 0,
              totalXP: citizen?.totalXP || 0,
              highestLevel: citizen?.highestLevel || 0,
              skills: citizen?.skills || {},
              permissions: {
                inventory: member.inventoryPermission,
                build: member.buildPermission,
                officer: member.officerPermission,
                coOwner: member.coOwnerPermission
              },
              lastLogin: member.lastLoginTimestamp,
              joinedAt: member.createdAt,
              isActive: member.lastLoginTimestamp && 
                       (Date.now() - new Date(member.lastLoginTimestamp).getTime()) < (7 * 24 * 60 * 60 * 1000)
            };
          });

          // Apply filters and pagination
          if (options.profession) {
            members = members.filter(m => m.profession.toLowerCase().includes(options.profession!.toLowerCase()));
          }
          
          if (!options.includeInactive) {
            members = members.filter(m => m.isActive);
          }

          // Apply pagination
          const total = members.length;
          const offset = options.offset || 0;
          const limit = options.limit || 20;
          members = members.slice(offset, offset + limit);

          return NextResponse.json({
            success: true,
            data: members,
            count: members.length,
            total: total,
            pagination: {
              limit: options.limit,
              offset: options.offset,
              hasMore: total > (offset + members.length)
            },
            meta: {
              dataSource: 'bitjita_api_fallback',
              lastUpdated: new Date().toISOString(),
              settlementId,
              fallbackReason: supabase ? 'local_database_error' : 'local_database_unavailable'
            }
          });
        }
      } catch (error) {
        console.error('BitJita API error:', error);
        // Fall through to empty response
      }
    }

    // Use Supabase if available
    if (supabase) {
      const members = await getAllMembers(options);

      return NextResponse.json({
        success: true,
        data: members,
        count: members.length,
        pagination: {
          limit: options.limit,
          offset: options.offset,
        },
        meta: {
          dataSource: 'supabase',
          lastUpdated: new Date().toISOString()
        }
      });
    }

    // Return empty response if no data source available
    console.log('Supabase not available, returning empty members list');
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      total: 0,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        hasMore: false
      },
      meta: {
        dataSource: 'demo_mode',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Settlement members API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch members',
      },
      { status: 500 }
    );
  }
} 