/**
 * Settlement Member Sync Command
 * Polls BitJita API to cache member and citizen data locally
 * Reduces real-time API hits by serving from local database
 */

import { createServerClient } from '../../../shared/supabase-client';
import { BitJitaAPI, type SettlementUser } from '../../integrations/bitjita-api';

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
    
    for (const user of users) {
      console.log(`🔄 Syncing user: ${user.userName} (${user.entityId})`);

      
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
      
      // Build clean database record
      const memberRecord = {
        settlement_id: options.settlementId,
        entity_id: user.entityId,
        claim_entity_id: user.claimEntityId,
        player_entity_id: user.playerEntityId,
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
        is_active: true,
        last_synced_at: new Date().toISOString(),
        sync_source: 'bitjita'
      };

      const { data, error } = await supabase
        .from('settlement_members')
        .upsert(memberRecord, {
          onConflict: 'settlement_id,entity_id',
          ignoreDuplicates: false
        })
        .select('id, name, total_skills, highest_level, top_profession');

      if (error) {
        console.error(`❌ Failed to sync user ${user.userName}:`, {
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
        syncSuccessCount++;
        results.membersUpdated++;
        if ((syncedUser.total_skills || 0) > 0) results.citizensUpdated++;
      } else {
        console.error(`⚠️ No data returned for user ${user.userName} - possible silent failure`);
        syncErrorCount++;
      }
    }



    // Verify data was actually saved
    const { count: memberCount, error: verifyError } = await supabase
      .from('settlement_members')
      .select('*', { count: 'exact', head: true })
      .eq('settlement_id', options.settlementId);

    if (verifyError) {
      console.error('❌ Error verifying member count:', verifyError);
    } else {
  
    }

    // Verify view works
    const { count: viewCount, error: viewError } = await supabase
      .from('settlement_member_details')
      .select('*', { count: 'exact', head: true })
      .eq('settlement_id', options.settlementId);

    if (viewError) {
      console.error('❌ Error verifying view:', viewError);
    } else {
  
    }

    // Mark members as inactive if they're no longer in the roster
    const currentMemberIds = users.map(u => u.entityId);
    
    if (currentMemberIds.length > 0) {
      const { error: deactivateError } = await supabase
        .from('settlement_members')
        .update({ 
          is_active: false, 
          last_synced_at: new Date().toISOString() 
        })
        .eq('settlement_id', options.settlementId)
        .not('entity_id', 'in', `(${currentMemberIds.map(id => `'${id}'`).join(',')})`);

      if (deactivateError) {
        console.error('Failed to deactivate missing members:', deactivateError);
      }
    }

    results.success = true;
    results.syncDurationMs = Date.now() - startTime;

    console.log(`✅ FIXED settlement sync completed for ${options.settlementId}:`);
    console.log(`   Users: ${results.membersUpdated} synced (${syncSuccessCount}/${users.length} successful)`);
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

  // Get all active settlements from our master list
  const { data: settlements, error: fetchError } = await supabase
    .from('settlements_master')
    .select('id, name')
    .eq('is_active', true)
    .order('population', { ascending: false }) // Sync largest settlements first
    .limit(50); // Limit to avoid API rate limits

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