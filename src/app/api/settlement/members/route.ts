import { NextRequest, NextResponse } from 'next/server';
import { type GetAllMembersOptions } from '../../../../lib/spacetime-db-new/modules';
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
        try {
          console.log(`🔍 Fetching member data for settlement ${settlementId} from local database`);
          
          // Get members from settlement_members table
          let membersQuery = supabase
            .from('settlement_members')
            .select('*')
            .eq('settlement_id', settlementId);

          if (!options.includeInactive) {
            membersQuery = membersQuery.eq('is_active', true);
          }

          const { data: members, error: membersError } = await membersQuery;

          if (membersError) {
            console.error('Members query error:', membersError);
            throw membersError;
          }

          // Get citizens data (skills) for the same settlement
          const { data: citizens, error: citizensError } = await supabase
            .from('settlement_citizens')
            .select('*')
            .eq('settlement_id', settlementId);

          if (citizensError) {
            console.warn('Citizens query error (some members may not have skills data):', citizensError);
          }

          console.log(`✅ Found ${members?.length || 0} members in local database`);

          if (members && members.length > 0) {
            // Get cached skill names from database (no BitJita API call)
            const { data: skillNamesData } = await supabase
              .from('skill_names')
              .select('skill_id, skill_name');
            
            const skillNames: Record<string, string> = {};
            (skillNamesData || []).forEach(row => {
              skillNames[row.skill_id] = row.skill_name;
            });

            // Create a lookup map for citizens data - using username since entity_ids don't match
            const citizensMap = new Map();
            (citizens || []).forEach(citizen => {
              citizensMap.set(citizen.user_name, citizen);
            });

                         // Transform database results to API format with full member details
             let formattedMembers = members.map(member => {
              const citizenData = citizensMap.get(member.user_name);
              
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
              
              return {
                id: member.entity_id,
                name: member.user_name,
                entityId: member.entity_id,
                profession: professionName,
                totalSkillLevel: citizenData?.total_level || 0,
                totalXP: citizenData?.total_xp || 0,
                highestLevel: citizenData?.highest_level || 0,
                totalSkills: citizenData?.total_skills || 0,
                skills: mappedSkills,
                permissions: {
                  inventory: member.inventory_permission || 0,
                  build: member.build_permission || 0,
                  officer: member.officer_permission || 0,
                  coOwner: member.co_owner_permission || 0
                },
                lastLogin: member.last_login_timestamp,
                joinedAt: member.joined_settlement_at,
                isActive: member.is_active,
                isRecentlyActive: member.last_login_timestamp && 
                                  (Date.now() - new Date(member.last_login_timestamp).getTime()) < (7 * 24 * 60 * 60 * 1000),
                // Additional useful info
                professionLevel: citizenData?.highest_level || 1,
                lastOnline: member.last_login_timestamp,
                joinDate: member.joined_settlement_at,
                // Calculated fields
                daysSinceLastLogin: member.last_login_timestamp 
                  ? Math.floor((Date.now() - new Date(member.last_login_timestamp).getTime()) / (1000 * 60 * 60 * 24))
                  : null,
                membershipDuration: member.joined_settlement_at
                  ? Math.floor((Date.now() - new Date(member.joined_settlement_at).getTime()) / (1000 * 60 * 60 * 24))
                  : null
              };
            });

            // Apply filters and pagination
            if (options.profession) {
              formattedMembers = formattedMembers.filter(m => m.profession.toLowerCase().includes(options.profession!.toLowerCase()));
            }
            
            if (!options.includeInactive) {
              formattedMembers = formattedMembers.filter(m => m.isActive);
            }

            // Apply pagination
            const total = formattedMembers.length;
            const offset = options.offset || 0;
            const limit = options.limit || 20;
            formattedMembers = formattedMembers.slice(offset, offset + limit);

            return NextResponse.json({
              success: true,
              data: formattedMembers,
              count: formattedMembers.length,
              total: total,
              pagination: {
                limit: options.limit,
                offset: options.offset,
                hasMore: total > (offset + formattedMembers.length)
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
          }
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
          const skillNames = citizensResult.data?.skillNames || {};
          
          // Combine roster and citizen data
          members = roster.map(member => {
            const citizen = citizens.find(c => c.userName === member.userName);
            
            // Transform skills from {skillId: level} to {skillName: level} using real BitJita skill names
            const mappedSkills: Record<string, number> = {};
            if (citizen?.skills) {
              Object.entries(citizen.skills).forEach(([skillId, level]) => {
                const skillName = skillNames[skillId] || `Skill ${skillId}`;
                mappedSkills[skillName] = level as number;
              });
            }
            
            return {
              id: member.entityId,
              name: member.userName,
              entityId: member.entityId,
              profession: citizen ? getTopProfession(citizen.skills) : 'Unknown',
              totalSkillLevel: citizen?.totalLevel || 0,
              totalXP: citizen?.totalXP || 0,
              highestLevel: citizen?.highestLevel || 0,
              skills: mappedSkills,
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

    // Use Supabase if available - query settlement_members and settlement_citizens directly
    if (supabase) {
      console.log('🔍 Fetching all members from settlement_members table (no settlement filter)');
      
      // Get all members from settlement_members table
      let membersQuery = supabase
        .from('settlement_members')
        .select('*');

      if (!options.includeInactive) {
        membersQuery = membersQuery.eq('is_active', true);
      }

      const { data: members, error: membersError } = await membersQuery;

      if (membersError) {
        console.error('Members query error:', membersError);
        throw membersError;
      }

      // Get all citizens data (skills)
      const { data: citizens, error: citizensError } = await supabase
        .from('settlement_citizens')
        .select('*');

      if (citizensError) {
        console.warn('Citizens query error (some members may not have skills data):', citizensError);
      }

              console.log(`✅ Found ${members?.length || 0} members in settlement_members table`);

        if (members && members.length > 0) {
          // Get cached skill names from database (no BitJita API call)
          const { data: skillNamesData } = await supabase
            .from('skill_names')
            .select('skill_id, skill_name');
          
          const skillNames: Record<string, string> = {};
          (skillNamesData || []).forEach(row => {
            skillNames[row.skill_id] = row.skill_name;
          });

          // Create a lookup map for citizens data
          const citizensMap = new Map();
          (citizens || []).forEach(citizen => {
            citizensMap.set(citizen.entity_id, citizen);
          });

           let formattedMembers = members.map(member => {
            const citizenData = citizensMap.get(member.user_name);
            
            // Map profession ID to name using real BitJita skill names
            const professionName = citizenData?.top_profession ? skillNames[citizenData.top_profession] || 'Unknown' : 'Unknown';

            // Transform skills from {skillId: level} to {skillName: level} using real BitJita skill names
            const mappedSkills: Record<string, number> = {};
            if (citizenData?.skills) {
              Object.entries(citizenData.skills).forEach(([skillId, level]) => {
                const skillName = skillNames[skillId] || `Skill ${skillId}`;
                mappedSkills[skillName] = level as number;
              });
            }
          
          return {
            id: member.entity_id,
            name: member.user_name,
            entityId: member.entity_id,
            profession: professionName,
            totalSkillLevel: citizenData?.total_level || 0,
            totalXP: citizenData?.total_xp || 0,
            highestLevel: citizenData?.highest_level || 0,
            totalSkills: citizenData?.total_skills || 0,
            skills: mappedSkills,
            professionLevel: citizenData?.highest_level || 1,
            permissions: {
              inventory: member.inventory_permission,
              build: member.build_permission,
              officer: member.officer_permission,
              coOwner: member.co_owner_permission
            },
            lastOnline: member.last_login_timestamp,
            joinDate: member.joined_settlement_at,
            isActive: member.is_active,
            // Calculated fields
            daysSinceLastLogin: member.last_login_timestamp 
              ? Math.floor((Date.now() - new Date(member.last_login_timestamp).getTime()) / (1000 * 60 * 60 * 24))
              : null,
            membershipDuration: member.joined_settlement_at
              ? Math.floor((Date.now() - new Date(member.joined_settlement_at).getTime()) / (1000 * 60 * 60 * 24))
              : null
          };
        });

        // Apply filters
        if (options.profession) {
          formattedMembers = formattedMembers.filter(m => m.profession.toLowerCase().includes(options.profession!.toLowerCase()));
        }
        
        if (!options.includeInactive) {
          formattedMembers = formattedMembers.filter(m => m.isActive);
        }

        // Apply pagination
        const total = formattedMembers.length;
        const offset = options.offset || 0;
        const limit = options.limit || 20;
        formattedMembers = formattedMembers.slice(offset, offset + limit);

        return NextResponse.json({
          success: true,
          data: formattedMembers,
          count: formattedMembers.length,
          total: total,
          pagination: {
            limit: options.limit,
            offset: options.offset,
            hasMore: total > (offset + formattedMembers.length)
          },
          meta: {
            dataSource: 'settlement_tables_direct_all',
            lastUpdated: new Date().toISOString(),
            lastSyncInfo: members && members.length > 0 
              ? `Last synced: ${new Date(members[0].last_synced_at).toLocaleString()}`
              : null
          }
        });
      }
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

export async function DELETE(_request: NextRequest) {
  try {
    // Import supabase client
    const { createServerClient } = await import('../../../../lib/spacetime-db-new/shared/supabase-client');
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database not available',
        },
        { status: 503 }
      );
    }

    // Delete all settlement members (cascade will handle related data)
    const { error } = await supabase
      .from('settlement_members')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all records (created_at is always >= epoch)

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'All settlement members deleted successfully',
    });

  } catch (error) {
    console.error('Settlement members deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete settlement members',
      },
      { status: 500 }
    );
  }
} 