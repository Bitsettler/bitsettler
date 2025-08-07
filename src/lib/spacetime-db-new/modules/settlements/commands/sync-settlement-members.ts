/**
 * Settlement Member Sync Command
 * Polls BitJita API to cache member and citizen data locally
 * Reduces real-time API hits by serving from local database
 */

import { createServerClient } from '../../../shared/supabase-client';
import { BitJitaAPI, type SettlementUser } from '../../integrations/bitjita-api';
// Activity tracking for member skill level-ups
import { trackMemberActivity, detectSkillChanges } from '@/lib/settlement/activity-tracker';

interface SyncSettlementMembersOptions {
  settlementId: string;
  settlementName?: string;
  forceFullSync?: boolean;
  triggeredBy?: string;
}

interface SyncResults {
  success: boolean;
  settlementId: string;
  membersFound: number;
  membersAdded: number;
  membersUpdated: number;
  membersDeactivated: number;
  citizensFound: number;
  citizensAdded: number;
  citizensUpdated: number;
  syncDurationMs: number;
  apiCallsMade: number;
  error?: string;
}

/**
 * Sync member and citizen data for a specific settlement
 */
export async function syncSettlementMembers(options: SyncSettlementMembersOptions): Promise<SyncResults> {
  const startTime = Date.now();

  // Use service role client to bypass RLS for sync operations
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Supabase service role client not available for member sync');
  }

  console.log(`🔄 Starting member sync for settlement ${options.settlementId}...`);

  const results: SyncResults = {
    success: false,
    settlementId: options.settlementId,
    membersFound: 0,
    membersAdded: 0,
    membersUpdated: 0,
    membersDeactivated: 0,
    citizensFound: 0,
    citizensAdded: 0,
    citizensUpdated: 0,
    syncDurationMs: 0,
    apiCallsMade: 0
  };

  try {
    // Fetch unified settlement users (combines roster + citizens data)
    const usersResult = await BitJitaAPI.fetchSettlementUsers(options.settlementId);

    results.apiCallsMade = 2; // fetchSettlementUsers now makes 2 API calls (members + citizens)

    if (!usersResult.success || !usersResult.data) {
      throw new Error(`Failed to fetch settlement users: ${usersResult.error}`);
    }

    const users = usersResult.data.users;
    const skillNames = usersResult.data.skillNames || {};

    results.membersFound = users.length;
    results.citizensFound = users.filter(u => u.totalSkills > 0).length;

    console.log(`📥 Fetched ${users.length} users from BitJita members API`);
    console.log(`🎯 Users that should have skills: ${results.citizensFound}/${users.length}`);

    // CRITICAL: If we get no users, this likely indicates an API issue
    // Don't proceed with sync to avoid marking everyone as inactive
    if (users.length === 0) {
      console.warn(`⚠️ No users returned from BitJita API for settlement ${options.settlementId}. This may indicate an API issue. Aborting sync to prevent data corruption.`);
      results.error = `No users returned from BitJita API - possible API issue`;
      results.success = false;
      results.syncDurationMs = Date.now() - startTime;
      return results;
    }

    // Store/update skill names in database for caching
    if (Object.keys(skillNames).length > 0) {
      console.log(`💾 Caching ${Object.keys(skillNames).length} skill names...`);
      for (const [skillId, skillName] of Object.entries(skillNames)) {
        await supabase
          .from('skill_names')
          .upsert({ 
            skill_id: skillId, 
            skill_name: skillName as string,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'skill_id',
            ignoreDuplicates: false
          });
      }
      console.log(`✅ Cached skill names in database`);
    }

    // CLEAN UNIFIED SYNC: One user entity with all data
    let syncSuccessCount = 0;
    let syncErrorCount = 0;
    
    console.log(`🔄 Syncing ${users.length} settlement users to database...`);
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`🔄 [${i+1}/${users.length}] Syncing user: ${user.userName} (${user.entityId})`);

      
      // Log skills info with ACTUAL data from BitJita
      const actualSkills = Object.keys(user.skills).length;
      const actualMaxLevel = user.highestLevel;
      const actualTotalLevel = user.totalLevel;
      
      console.log(`   🎯 ACTUAL SKILLS: ${actualSkills} skills found`);

      
      if (actualSkills > 0) {
        const skillEntries = Object.entries(user.skills).slice(0, 3);
        console.log(`   🔥 Skills sample: ${skillEntries.map(([id, level]) => `${id}:${level}`).join(', ')}`);
      } else {
        console.log(`   ⚠️ BitJita member data has no skills fields`);
  
      }
      
          // Get existing member data for activity tracking
    const { data: existingMemberData } = await supabase
      .from('settlement_members')
      .select('id, skills')
      .eq('settlement_id', options.settlementId)
      .eq('player_entity_id', user.playerEntityId)
      .single();

      const oldSkills = existingMemberData?.skills as Record<string, number> || {};

      // Build clean database record
      const memberRecord = {
        settlement_id: options.settlementId,
        player_entity_id: user.playerEntityId, // PRIMARY: Stable player character ID  
        entity_id: user.entityId,               // SECONDARY: Generic entity reference
        claim_entity_id: user.claimEntityId,    // Settlement claim reference
        name: user.userName,
        
        // Skills & Progression
        skills: user.skills,
        total_skills: user.totalSkills,
        highest_level: user.highestLevel,
        total_level: user.totalLevel,
        total_xp: user.totalXP,
        // top_profession auto-calculated by database trigger
        
        // Settlement Permissions
        inventory_permission: user.inventoryPermission,
        build_permission: user.buildPermission,
        officer_permission: user.officerPermission,
        co_owner_permission: user.coOwnerPermission,
        
        // Timestamps
        last_login_timestamp: user.lastLoginTimestamp ? new Date(user.lastLoginTimestamp).toISOString() : null,
        joined_settlement_at: user.joinedAt ? new Date(user.joinedAt).toISOString() : null,
        
        // Active status: true if currently in settlement (from BitJita API response)
        // REPURPOSED: is_active now means "currently in settlement" not "logged in last 7 days"
        is_active: true, // If user is in BitJita response, they're in settlement
        last_synced_at: new Date().toISOString(),
        sync_source: 'bitjita'
      };

      const { data, error } = await supabase
        .from('settlement_members')
        .upsert(memberRecord, {
          onConflict: 'settlement_id,player_entity_id',
          ignoreDuplicates: false
        })
        .select('id, name, total_skills, highest_level, top_profession');

      if (error) {
        console.error(`❌ [${i+1}/${users.length}] FAILED to sync user ${user.userName} (${user.entityId}):`, {
          error: error.message || error,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        syncErrorCount++;
      } else if (data && data.length > 0) {
        const syncedUser = data[0];
        const skillsDisplay = syncedUser.total_skills || 'Unknown';
        const maxLevelDisplay = syncedUser.highest_level || 'Unknown';  
        const topProfessionDisplay = syncedUser.top_profession || 'Unknown';
        
        console.log(`✅ SYNCED ${syncedUser.name}: Skills=${skillsDisplay}, Max Level=${maxLevelDisplay}, Top=${topProfessionDisplay}`);
        
        // Track member activity for skill changes
        try {
          const skillChanges = detectSkillChanges(oldSkills, user.skills, skillNames);
          
          if (skillChanges.length > 0) {
            await trackMemberActivity({
              memberId: syncedUser.id,
              memberName: syncedUser.name,
              settlementId: options.settlementId,
              skillChanges,
              totalLevel: user.totalLevel,
              skillCount: Object.keys(user.skills).length
            });
          }
        } catch (activityError) {
          console.error(`⚠️ Failed to track activity for ${syncedUser.name}:`, activityError);
          // Don't fail the sync if activity tracking fails
        }
        
        syncSuccessCount++;
        results.membersUpdated++;
        if ((syncedUser.total_skills || 0) > 0) results.citizensUpdated++;
      } else {
        console.error(`⚠️ No data returned for user ${user.userName} - possible silent failure`);
        syncErrorCount++;
      }
    }

    // Mark members as no longer in settlement if they're not in the current BitJita roster
    // Use name-based matching since entity IDs are inconsistent between BitJita responses
    const currentMemberNames = users.map(u => u.userName).filter(name => name); // Remove any undefined names
    
    // CRITICAL: Only deactivate members if we successfully got member data from BitJita
    // If currentMemberNames is empty, it likely means API failed - don't deactivate anyone!
    if (currentMemberNames.length > 0 && users.length > 0) {
      console.log(`🔄 Deactivating members not in current roster of ${currentMemberNames.length} members...`);

      

      
      // Use client-side filtering: fetch all active members, then deactivate those not in current roster
      const { data: allActiveMembers, error: fetchError2 } = await supabase
        .from('settlement_members')
        .select('id, name')
        .eq('settlement_id', options.settlementId)
        .eq('is_active', true);
      
      if (fetchError2) {
        console.error(`❌ Failed to fetch active members:`, fetchError2);
      } else if (allActiveMembers) {
        // Filter client-side to find members not in current BitJita roster
        const membersToDeactivate = allActiveMembers.filter(member => 
          !currentMemberNames.includes(member.name)
        );
        
        console.log(`🎯 Found ${membersToDeactivate.length} members to deactivate out of ${allActiveMembers.length} active`);
        
        if (membersToDeactivate.length > 0) {
          const memberIdsToDeactivate = membersToDeactivate.map(m => m.id);
          
          const { data: deactivateData, error: deactivateError } = await supabase
            .from('settlement_members')
            .update({ 
              is_active: false,
              last_synced_at: new Date().toISOString() 
            })
            .in('id', memberIdsToDeactivate)
            .select('name');
          
          if (deactivateError) {
            console.error(`❌ Failed to deactivate former members:`, deactivateError);
          } else {
            console.log(`✅ Deactivated ${deactivateData?.length || 0} former members:`, deactivateData?.map(m => m.name).slice(0, 5));
            results.membersDeactivated = deactivateData?.length || 0;
          }
        } else {
          console.log(`✅ No members need to be deactivated`);
        }
      }
    } else {
      console.log(`⚠️  Skipping member deactivation - no valid member data received from BitJita API (${users.length} users, ${currentMemberNames.length} valid names)`);
    }

    results.success = true;
    results.syncDurationMs = Date.now() - startTime;

    // Count active vs inactive members after sync
    const { data: memberCounts } = await supabase
      .from('settlement_members')
      .select('is_active')
      .eq('settlement_id', options.settlementId);
    
    const activeMemberCount = memberCounts?.filter(m => m.is_active).length || 0;
    const inactiveMemberCount = memberCounts?.filter(m => !m.is_active).length || 0;

    console.log(`✅ Settlement sync completed for ${options.settlementId}:`);
    console.log(`   🎯 ACTUAL RESULTS: ${syncSuccessCount}/${users.length} users successfully synced`);
    console.log(`   ❌ FAILED: ${syncErrorCount} users failed to sync`);
    console.log(`   In Settlement: ${activeMemberCount} (currently in settlement)`);
    console.log(`   Former Members: ${inactiveMemberCount} (no longer in settlement)`);
    console.log(`   With Skills: ${results.citizensUpdated} users have actual skills data`);
    console.log(`   Duration: ${results.syncDurationMs}ms`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.error = errorMessage;
    results.syncDurationMs = Date.now() - startTime;
    
    console.error(`❌ Member sync failed for ${options.settlementId}:`, errorMessage);
  }

  // Log sync attempt
  try {
    await supabase
      .from('settlement_member_sync_log')
      .insert({
        settlement_id: options.settlementId,
        settlement_name: options.settlementName,
        sync_type: options.forceFullSync ? 'full_sync' : 'scheduled_sync',
        members_found: results.membersFound,
        members_added: results.membersAdded,
        members_updated: results.membersUpdated,
        members_deactivated: results.membersDeactivated,
        citizens_found: results.citizensFound,
        citizens_added: results.citizensAdded,
        citizens_updated: results.citizensUpdated,
        sync_duration_ms: results.syncDurationMs,
        api_calls_made: results.apiCallsMade,
        success: results.success,
        error_message: results.error,
        triggered_by: options.triggeredBy || 'system',
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString()
      });
  } catch (logError) {
    console.error('Failed to log member sync:', logError);
  }

  return results;
}

/**
 * Sync members for all known active settlements
 */
export async function syncAllSettlementMembers(triggeredBy: string = 'scheduled'): Promise<{
  success: boolean;
  settlementsProcessed: number;
  totalMembers: number;
  totalCitizens: number;
  errors: string[];
}> {
  // Use service role client to bypass RLS for sync operations
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Supabase service role client not available for bulk member sync');
  }

  console.log('🔄 Starting bulk member sync for all settlements...');

  // Get settlements that have claimed users (users who have linked their accounts)
  // This follows the user's requirement: only sync settlements where users have actually claimed characters
  
  // First, get settlement IDs with claimed users
  const { data: claimedSettlements, error: claimedError } = await supabase
    .from('settlement_members')
    .select('settlement_id')
    .not('supabase_user_id', 'is', null); // Has claimed users
  
  if (claimedError) {
    throw new Error(`Failed to fetch claimed settlements: ${claimedError.message}`);
  }

  const claimedSettlementIds = [...new Set(claimedSettlements?.map(s => s.settlement_id) || [])];
  
  if (claimedSettlementIds.length === 0) {
    console.log('📭 No settlements with claimed users found');
    return {
      success: true,
      settlementsProcessed: 0,
      totalMembers: 0,
      totalCitizens: 0,
      errors: []
    };
  }

  console.log(`Found ${claimedSettlementIds.length} settlements with claimed users`);

  // Now get the settlement details for these claimed settlements
  const { data: settlements, error: fetchError } = await supabase
    .from('settlements_master')
    .select('id, name, is_active')
    .in('id', claimedSettlementIds)
    .order('population', { ascending: false }) // Sync largest settlements first
    .limit(50); // Limit to avoid API rate limits

  console.log(`🏘️ Found ${settlements?.length || 0} settlements to sync:`, settlements?.map(s => `${s.name} (active: ${s.is_active})`));

  if (fetchError) {
    throw new Error(`Failed to fetch settlements: ${fetchError.message}`);
  }

  const summary = {
    success: true,
    settlementsProcessed: 0,
    totalMembers: 0,
    totalCitizens: 0,
    errors: [] as string[]
  };

  console.log(`🔥 Syncing ${settlements?.length || 0} settlements with claimed users`);

  for (const settlement of settlements || []) {
    try {
      const result = await syncSettlementMembers({
        settlementId: settlement.id,
        settlementName: settlement.name,
        triggeredBy
      });

      summary.settlementsProcessed++;
      summary.totalMembers += result.membersUpdated;
      summary.totalCitizens += result.citizensUpdated;

      if (!result.success) {
        summary.errors.push(`${settlement.name}: ${result.error}`);
      }

      // Rate limiting: wait 1 second between settlements
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      const errorMessage = `${settlement.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      summary.errors.push(errorMessage);
      console.error(`Failed to sync ${settlement.name}:`, error);
    }
  }

  summary.success = summary.errors.length === 0;

  console.log(`✅ Bulk member sync completed:`);
  console.log(`   Settlements processed: ${summary.settlementsProcessed}`);
  console.log(`   Total members synced: ${summary.totalMembers}`);
  console.log(`   Total citizens synced: ${summary.totalCitizens}`);
  console.log(`   Errors: ${summary.errors.length}`);

  return summary;
} 