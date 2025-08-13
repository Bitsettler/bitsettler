import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';
import { DatabaseSettlementMember, formatAsAvailableCharacter } from '@/lib/types/settlement-member';

/**
 * Settlement Establishment API
 * 
 * Flow:
 * 1. User selects settlement from BitJita search
 * 2. API fetches settlement data from BitJita
 * 3. Creates settlement in settlements_master table
 * 4. Fetches and stores all member data
 * 5. Returns available characters for user to claim
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { settlementId, settlementName } = body;

    if (!settlementId || !settlementName) {
      return NextResponse.json(
        { success: false, error: 'settlementId and settlementName are required' },
        { status: 400 }
      );
    }

    console.log(`🏛️ Establishing settlement: ${settlementName} (${settlementId})`);

    // 1. Check if settlement already exists
    const { data: existingSettlement, error: checkError } = await supabase
      .from('settlements_master')
      .select('id, name')
      .eq('id', settlementId)
      .single();

    if (checkError) {
      console.error('❌ Error checking settlement existence:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check settlement existence' },
        { status: 500 }
      );
    }

    if (existingSettlement && 'name' in existingSettlement) {
      console.log(`✅ Settlement already exists: ${existingSettlement.name}`);
      
      // Settlement exists, so get the available characters from our database using direct query
      console.log(`🔍 Establish API: Fetching members directly from database for settlement ${settlementId}`);
   
      try {
        // Call BitJita API directly instead of making internal HTTP calls
        console.log(`🔗 Calling BitJita API directly for settlement ${settlementId}`);
        
        const bitjitaModule = await import('@/lib/spacetime-db-new/modules/integrations/bitjita-api');
        const { BitJitaAPI } = bitjitaModule;
        type BitJitaRawMember = bitjitaModule.BitJitaRawMember;
        
        const [rosterResult, citizensResult] = await Promise.all([
          BitJitaAPI.fetchSettlementRoster(settlementId),
          BitJitaAPI.fetchSettlementCitizens(settlementId)
        ]);

        console.log('🔍 BitJita roster result:', rosterResult.success ? `Success: ${rosterResult.data?.members?.length || 0} members` : `Error: ${rosterResult.error}`);
        console.log('🔍 BitJita citizens result:', citizensResult.success ? `Success: ${citizensResult.data?.citizens?.length || 0} citizens` : `Error: ${citizensResult.error}`);

        if (rosterResult.success && rosterResult.data.members) {
          console.log(`🔍 BitJita roster returned ${rosterResult.data.members.length} members`);
          
          // Create a map of citizens data by entity_id for quick lookup
          const citizensMap = new Map();
          if (citizensResult.success && citizensResult.data?.citizens) {
            citizensResult.data.citizens.forEach((citizen: any) => {
              citizensMap.set(citizen.entity_id, citizen);
            });
            console.log(`📊 Citizens data mapped: ${citizensMap.size} characters with stats`);
          } else {
            console.warn('⚠️ Citizens API failed or returned no data:', citizensResult.error);
          }

          const memberData = rosterResult.data.members.map((member: BitJitaRawMember) => {
            // Get corresponding citizen data for character stats
            const citizenData = citizensMap.get(member.playerEntityId) || {};
            
            // Debug logging for character data
            if (Object.keys(citizenData).length > 0) {
              console.log(`📊 Found citizen data for ${member.userName}: Level ${citizenData.totalLevel}, Skills: ${citizenData.totalSkills}`);
            } else {
              console.log(`⚠️ No citizen data found for ${member.userName} (${member.entityId})`);
            }
            
            return {
              settlement_id: settlementId,
              entity_id: member.entityId,
              claim_entity_id: member.claimEntityId,
              player_entity_id: member.playerEntityId,
              bitjita_user_id: member.playerEntityId, // Use playerEntityId as BitJita user ID
              name: member.userName || 'Unknown Player',
              
              // Real character stats from citizens API
              skills: citizenData.skills || {},
              total_skills: citizenData.totalSkills || 0,
              highest_level: citizenData.highestLevel || 0,
              total_level: citizenData.totalLevel || 0,
              total_xp: citizenData.totalXP || 0,
              top_profession: 'Settler', // BitJita citizen data doesn't include profession info
              
              // Permission data from roster API
              inventory_permission: member.inventoryPermission || 0,
              build_permission: member.buildPermission || 0,
              officer_permission: member.officerPermission || 0,
              co_owner_permission: member.coOwnerPermission || 0,
              last_login_timestamp: member.lastLoginTimestamp ? new Date(member.lastLoginTimestamp) : null,
              joined_settlement_at: member.createdAt ? new Date(member.createdAt) : null,
              is_active: true,
              last_synced_at: new Date(),
              sync_source: 'establishment_with_stats'
            };
          });

          console.log(`👥 Importing ${memberData.length} members from BitJita...`);
          console.log(`📊 Character stats loaded: ${citizensResult.success ? citizensResult.data?.citizens?.length || 0 : 0} citizens with real levels`);

          // 5. Insert member data
          const { data: insertedMembers, error: membersError } = await supabase
            .from('settlement_members')
            .upsert(memberData, {
              onConflict: 'settlement_id, player_entity_id'
            })
            .select();

          if (membersError) {
            console.error('❌ Failed to insert member data:', membersError);
            console.warn('⚠️ Settlement created but member data failed to insert');
          } else {
            console.log(`✅ Successfully imported ${insertedMembers.length} members`);
          }
        } else {
          console.warn('⚠️ No member data available from BitJita roster, settlement created without members');
          console.warn('⚠️ Roster API result:', {
            success: rosterResult.success,
            error: rosterResult.error,
            dataStructure: rosterResult.data ? Object.keys(rosterResult.data) : 'no data',
            membersLength: rosterResult.data?.members?.length || 0
          });
          if (!citizensResult.success) {
            console.warn('⚠️ Citizens API also failed, character stats will be defaults');
            console.warn('⚠️ Citizens API result:', {
              success: citizensResult.success,
              error: citizensResult.error
            });
          }
        }
      } catch (memberError) {
        console.error('❌ Failed to fetch members from BitJita:', memberError);
        console.warn('⚠️ Settlement created but member import failed');
      }
      
      const { data: members, error: membersError } = await supabase
        .from('settlement_members')
        .select(`
          id,
          entity_id,
          player_entity_id,
          claim_entity_id,
          name,
          settlement_id,
          skills,
          total_skills,
          highest_level,
          total_level,
          total_xp,
          top_profession,
          inventory_permission,
          build_permission,
          officer_permission,
          co_owner_permission,
          last_login_timestamp,
          joined_settlement_at,
          is_active,
          last_synced_at,
          sync_source,
          supabase_user_id
        `)
        .eq('settlement_id', settlementId);

      if (membersError) {
        console.error('❌ Failed to fetch members from database:', membersError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch settlement members from database'
        }, { status: 500 });
      }

      console.log(`👥 Establish API: Found ${members?.length || 0} members in database`);
      
      // Debug: Log member claim status
      if (members && members.length > 0) {
        members.forEach((member, index) => {
          console.log(`🔍 Member ${index + 1}: ${member.name} (${member.player_entity_id}) - Claimed: ${!!member.supabase_user_id} (User ID: ${member.supabase_user_id || 'none'})`);
        });
      }

      // Transform database data to available characters format (only unclaimed characters)
      const availableCharacters = (members || [])
        .filter(member => {
          const isUnclaimed = member && 'supabase_user_id' in member && !member.supabase_user_id;
          console.log(`🔍 Filter check for ${member?.name}: unclaimed = ${isUnclaimed}`);
          return isUnclaimed;
        }) // Only unclaimed characters
        .map((member) => {
          if (!member || typeof member !== 'object') return null;
          return formatAsAvailableCharacter({
            id: member.entity_id,
            entity_id: member.entity_id,
            player_entity_id: member.player_entity_id,
            claim_entity_id: member.claim_entity_id,
            name: member.name || 'Unknown Player',
            settlement_id: member.settlement_id,
            skills: member.skills || {},
            total_skills: member.total_skills || 0,
            highest_level: member.highest_level || 0,
            total_level: member.total_level || 0,
            total_xp: member.total_xp || 0,
            top_profession: member.top_profession || 'Unknown',
            inventory_permission: member.inventory_permission || 0,
            build_permission: member.build_permission || 0,
            officer_permission: member.officer_permission || 0,
            co_owner_permission: member.co_owner_permission || 0,
            last_login_timestamp: member.last_login_timestamp,
            joined_settlement_at: member.joined_settlement_at,
            is_active: member.is_active,
            is_claimed: !!member.supabase_user_id,
            last_synced_at: member.last_synced_at,
            sync_source: member.sync_source
          });
        })
        .filter(Boolean);

      console.log(`🎭 Establish API: Found ${availableCharacters.length} unclaimed characters available for claiming`);

      return NextResponse.json({
        success: true,
        message: 'Settlement already established - proceed to claim character',
        data: {
          settlement: existingSettlement,
          availableCharacters
        }
      });
    }

    // 2. Create settlement in settlements_master table (requires authentication)
    console.log('🔐 Settlement creation requires authentication...');
    
    // Verify authentication for settlement creation
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: `Authentication required for settlement creation: ${authResult.error}` },
        { status: authResult.status }
      );
    }

    const { session, user } = authResult;
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    console.log(`✅ Authenticated user ${user.email} creating settlement`);

    const { data: settlement, error: settlementError } = await supabase
      .from('settlements_master')
      .insert({
        id: settlementId,
        name: settlementName,
        tier: 0, // Will be updated when we fetch from BitJita
        treasury: 0,
        supplies: 0,
        tiles: 0,
        population: 0,
        name_normalized: settlementName.toLowerCase(),
        name_searchable: settlementName,
        is_active: true,
        sync_source: 'establishment',
        is_established: true
      } as any)
      .select()
      .single();

    if (settlementError) {
      console.error('❌ Failed to create settlement:', settlementError);
      return NextResponse.json(
        { success: false, error: 'Failed to create settlement in database' },
        { status: 500 }
      );
    }

    // 3. Start treasury polling for the new settlement
    try {
      console.log('💰 Starting treasury polling for new settlement...');
      const { TreasuryPollingService } = await import('@/lib/spacetime-db-new/modules/treasury/services/treasury-polling-service');
      const treasuryService = TreasuryPollingService.getInstance();
      
      const initialSnapshot = await treasuryService.pollTreasuryData(settlementId);
      if (initialSnapshot) {
        console.log(`✅ Treasury polling started with initial balance: ${initialSnapshot.balance}`);
      } else {
        console.warn('⚠️ Treasury polling started but no initial snapshot created');
      }
    } catch (pollingError) {
      console.error('❌ Failed to start treasury polling:', pollingError);
      // Don't fail settlement creation if polling fails - it can be started manually later
    }

    // 4. Settlement created successfully

    // 4. Fetch real settlement data from BitJita API (treasury, roster, and citizens)
    console.log(`🔍 Fetching settlement data from BitJita for ${settlementId}...`);
    
    // 4a. First, fetch settlement details (treasury, tier, etc.)
    let settlementDetails: any = null;
    try {
      const detailsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settlement/search?q=${encodeURIComponent(settlementName)}`);
      const detailsResult = await detailsResponse.json();
      
      if (detailsResult.success && detailsResult.data?.settlements?.length > 0) {
        // Find the exact settlement by ID
        settlementDetails = detailsResult.data.settlements.find((s: any) => s.id === settlementId);
        
        if (settlementDetails) {
          console.log(`💰 Found settlement details:`, {
            name: settlementDetails.name,
            treasury: settlementDetails.treasury,
            tier: settlementDetails.tier,
            tiles: settlementDetails.tiles
          });
          
                     // Update settlement with real data from BitJita
           const { error: updateError } = await supabase
             .from('settlements_master')
             .update({
               treasury: settlementDetails.treasury || 0,
               tier: settlementDetails.tier || 0,
               tiles: settlementDetails.tiles || 0,
               supplies: settlementDetails.supplies || 0,
               last_synced_at: new Date().toISOString(),
               sync_source: 'bitjita_establishment'
             } as any)
             .eq('id', settlementId);
            
          if (updateError) {
            console.error('❌ Failed to update settlement with BitJita data:', updateError);
          } else {
            console.log(`✅ Updated settlement with BitJita data: Treasury ${settlementDetails.treasury}, Tier ${settlementDetails.tier}, Tiles ${settlementDetails.tiles}`);
          }
        } else {
          console.warn(`⚠️ Settlement ${settlementName} not found in search results`);
        }
      } else {
        console.warn(`⚠️ Failed to fetch settlement details from BitJita:`, detailsResult.error);
      }
    } catch (detailsError) {
      console.error('❌ Failed to fetch settlement details:', detailsError);
    }
    
    // 4b. Fetch member data
    let members: any[] = [];
    
    try {
      // Fetch both roster (for permissions) and citizens (for character stats) in parallel
      const [rosterResponse, citizensResponse] = await Promise.all([
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settlement/roster?settlementId=${settlementId}`),
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settlement/citizens?settlementId=${settlementId}`)
      ]);
      
      const [rosterResult, citizensResult] = await Promise.all([
        rosterResponse.json(),
        citizensResponse.json()
      ]);

      if (rosterResult.success && rosterResult.data.members) {
        // Create a map of citizens data by entity_id for quick lookup
        const citizensMap = new Map();
        if (citizensResult.success && citizensResult.data?.citizens) {
          citizensResult.data.citizens.forEach((citizen: any) => {
            citizensMap.set(citizen.entity_id, citizen);
          });
          console.log(`📊 Citizens data mapped: ${citizensMap.size} characters with stats`);
        } else {
          console.warn('⚠️ Citizens API failed or returned no data:', citizensResult.error);
        }

        const memberData = rosterResult.data.members.map((member: DatabaseSettlementMember) => {
          // Get corresponding citizen data for character stats
          const citizenData = citizensMap.get(member.entity_id) || {};
          
          // Debug logging for character data
          if (Object.keys(citizenData).length > 0) {
            console.log(`📊 Found citizen data for ${member.name}: Level ${citizenData.total_level}, Profession: ${citizenData.top_profession}`);
          } else {
            console.log(`⚠️ No citizen data found for ${member.name} (${member.entity_id})`);
          }
          
          return {
            settlement_id: settlementId,
            entity_id: member.entity_id,
            claim_entity_id: member.claim_entity_id,
            player_entity_id: member.player_entity_id,
            bitjita_user_id: member.bitjita_user_id,
            name: member.name,
            
            // Real character stats from citizens API
            skills: citizenData.skills || {},
            total_skills: citizenData.total_skills || 0,
            highest_level: citizenData.highest_level || 0,
            total_level: citizenData.total_level || 0,
            total_xp: citizenData.total_xp || 0,
            top_profession: citizenData.top_profession || 'Settler',
            
            // Permission data from roster API
            inventory_permission: member.inventory_permission || 0,
            build_permission: member.build_permission || 0,
            officer_permission: member.officer_permission || 0,
            co_owner_permission: member.co_owner_permission || 0,
            last_login_timestamp: member.last_login_timestamp,
            joined_settlement_at: member.joined_settlement_at,
            is_active: true,
            last_synced_at: new Date(),
            sync_source: 'establishment_with_stats'
          };
        });

        console.log(`👥 Importing ${memberData.length} members from BitJita...`);
        console.log(`📊 Character stats loaded: ${citizensResult.success ? citizensResult.data?.citizens?.length || 0 : 0} citizens with real levels`);

        // 5. Insert member data
        const { data: insertedMembers, error: membersError } = await supabase
          .from('settlement_members')
          .insert(memberData)
          .select();

        if (membersError) {
          console.error('❌ Failed to insert member data:', membersError);
          console.warn('⚠️ Settlement created but member data failed to insert');
        } else {
          members = insertedMembers || [];
          console.log(`✅ Successfully imported ${members.length} members`);
        }
      } else {
        console.warn('⚠️ No member data available from BitJita roster, settlement created without members');
        if (!citizensResult.success) {
          console.warn('⚠️ Citizens API also failed, character stats will be defaults');
        }
      }
    } catch (memberError) {
      console.error('❌ Failed to fetch members from BitJita:', memberError);
      console.warn('⚠️ Settlement created but member import failed');
    }

    // 6. Get the updated settlement
    const { data: finalSettlement, error: fetchError } = await supabase
      .from('settlements_master')
      .select('*')
      .eq('id', settlementId)
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch final settlement:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Settlement created but failed to retrieve' },
        { status: 500 }
      );
    }

    console.log(`🎉 Settlement established successfully: ${settlementName}`);
    console.log(`👥 Members imported: ${members?.length || 0}`);

    // Transform member data to match frontend expectations
          const transformedCharacters = (members || []).map((member: DatabaseSettlementMember) => ({
      id: member.entity_id,
      name: member.name,
      settlement_id: member.settlement_id,
      entity_id: member.entity_id,
      bitjita_user_id: member.bitjita_user_id,
      skills: member.skills || {},
      top_profession: member.top_profession || 'Unknown',
      total_level: member.total_level || 0,
      permissions: {
        inventory: Boolean(member.inventory_permission),
        build: Boolean(member.build_permission),
        officer: Boolean(member.officer_permission),
        co_owner: Boolean(member.co_owner_permission)
      }
    }));

    return NextResponse.json({
      success: true,
      message: `Settlement ${settlementName} established successfully`,
      data: {
        settlement: finalSettlement,
        availableCharacters: transformedCharacters,
        membersImported: members?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Settlement establishment error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during settlement establishment'
    }, { status: 500 });
  }
}