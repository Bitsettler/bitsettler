import { NextRequest, NextResponse } from 'next/server';
import { type GetAllMembersOptions } from '../../../../lib/spacetime-db-new/modules';
import { supabase } from '../../../../lib/spacetime-db-new/shared/supabase-client';
import { BitJitaAPI } from '../../../../lib/spacetime-db-new/modules/integrations/bitjita-api';

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

    // Use unified settlement_members table - much simpler!
    if (supabase) {
      try {
        console.log(`🔍 Fetching members from unified settlement_members table`);
        
        // Single query to unified table - no more complex joins!
        let query = supabase
          .from('settlement_members')
          .select('*');

        // Apply filters
        if (settlementId) {
          query = query.eq('settlement_id', settlementId);
        }
        
        if (!options.includeInactive) {
          query = query.eq('is_active', true);
        }

        if (options.profession) {
          query = query.ilike('top_profession', `%${options.profession}%`);
        }

        // Apply pagination at database level
        if (options.limit) {
          query = query.limit(options.limit);
        }
        if (options.offset) {
          query = query.range(options.offset, (options.offset + (options.limit || 20)) - 1);
        }

        const { data: members, error } = await query;

        if (error) {
          console.error('Members query error:', error);
          throw error;
        }

        console.log(`✅ Found ${members?.length || 0} members in unified table`);

        if (members && members.length > 0) {
          // Transform to API format - skills already in correct format!
          const formattedMembers = members.map(member => ({
            id: member.entity_id,
            name: member.name,
            entityId: member.entity_id,
            profession: member.top_profession || 'Unknown',
            totalSkillLevel: member.total_level || 0,
            totalXP: member.total_xp || 0,
            highestLevel: member.highest_level || 0,
            totalSkills: member.total_skills || 0,
            skills: member.skills || {}, // Already in {skillName: level} format!
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
            professionLevel: member.highest_level || 1,
            lastOnline: member.last_login_timestamp,
            joinDate: member.joined_settlement_at,
            // Calculated fields
            daysSinceLastLogin: member.last_login_timestamp 
              ? Math.floor((Date.now() - new Date(member.last_login_timestamp).getTime()) / (1000 * 60 * 60 * 24))
              : null,
            membershipDuration: member.joined_settlement_at
              ? Math.floor((Date.now() - new Date(member.joined_settlement_at).getTime()) / (1000 * 60 * 60 * 24))
              : null,
            // App user data (if claimed)
            displayName: member.display_name,
            discordHandle: member.discord_handle,
            isClaimed: !!member.auth_user_id
          }));

          return NextResponse.json({
            success: true,
            data: formattedMembers,
            count: formattedMembers.length,
            meta: {
              dataSource: 'unified_settlement_members',
              lastUpdated: new Date().toISOString(),
              settlementId,
              lastSyncInfo: members.length > 0 
                ? `Last synced: ${new Date(members[0].last_synced_at).toLocaleString()}`
                : null
            }
          });
        }
      } catch (dbError) {
        console.error('Unified table query failed:', dbError);
        // Fall through to BitJita API fallback
      }

      // Fallback to BitJita API if local database fails
      if (settlementId) {
        console.log(`🌐 Falling back to BitJita API for settlement ${settlementId}`);
        
        try {
          const [rosterResult, citizensResult] = await Promise.all([
            BitJitaAPI.fetchSettlementRoster(settlementId),
            BitJitaAPI.fetchSettlementCitizens(settlementId)
          ]);

          if (rosterResult.success && citizensResult.success) {
            const roster = rosterResult.data?.members || [];
            const citizens = citizensResult.data?.citizens || [];
            const skillNames = citizensResult.data?.skillNames || {};
            
            // Combine roster and citizen data
            const members = roster.map(member => {
              const citizen = citizens.find(c => c.userName === member.userName);
              
              // Transform skills from {skillId: level} to {skillName: level}
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
                profession: citizen?.topProfession || 'Unknown',
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
                         (Date.now() - new Date(member.lastLoginTimestamp).getTime()) < (7 * 24 * 60 * 60 * 1000),
                isClaimed: false
              };
            });

            return NextResponse.json({
              success: true,
              data: members,
              count: members.length,
              meta: {
                dataSource: 'bitjita_api_fallback',
                lastUpdated: new Date().toISOString(),
                settlementId
              }
            });
          }
        } catch (error) {
          console.error('BitJita API error:', error);
        }
      }
    }

    // Return empty response if no data available
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      meta: {
        dataSource: 'no_data_available',
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
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Delete all settlement members (cascade will handle related data)
    const { error } = await supabase
      .from('settlement_members')
      .delete()
      .gte('created_at', '1970-01-01');

    if (error) throw error;

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