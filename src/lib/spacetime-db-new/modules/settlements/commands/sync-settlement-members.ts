/**
 * Settlement Member Sync Command
 * Polls BitJita API to cache member and citizen data locally
 * Reduces real-time API hits by serving from local database
 */

import { createServerClient } from '../../../shared/supabase-client';
import { BitJitaAPI } from '../../integrations/bitjita-api';

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
  const supabase = createServerClient();

  if (!supabase) {
    throw new Error('Supabase client not available for member sync');
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
    // Fetch member roster and citizen data from BitJita API
    const [rosterResult, citizensResult] = await Promise.all([
      BitJitaAPI.fetchSettlementRoster(options.settlementId),
      BitJitaAPI.fetchSettlementCitizens(options.settlementId)
    ]);

    results.apiCallsMade = 2;

    if (!rosterResult.success || !citizensResult.success) {
      throw new Error(`API calls failed: Roster=${rosterResult.error}, Citizens=${citizensResult.error}`);
    }

    const members = rosterResult.data?.members || [];
    const citizens = citizensResult.data?.citizens || [];

    results.membersFound = members.length;
    results.citizensFound = citizens.length;

    console.log(`📥 Fetched ${members.length} members and ${citizens.length} citizens from BitJita`);

    // Sync members
    for (const member of members) {
      const memberData = {
        settlement_id: options.settlementId,
        entity_id: member.entityId,
        claim_entity_id: member.claimEntityId,
        player_entity_id: member.playerEntityId,
        user_name: member.userName,
        inventory_permission: member.inventoryPermission,
        build_permission: member.buildPermission,
        officer_permission: member.officerPermission,
        co_owner_permission: member.coOwnerPermission,
        created_at: member.createdAt ? new Date(member.createdAt).toISOString() : null,
        updated_at: member.updatedAt ? new Date(member.updatedAt).toISOString() : null,
        last_login_timestamp: member.lastLoginTimestamp ? new Date(member.lastLoginTimestamp).toISOString() : null,
        joined_settlement_at: member.createdAt ? new Date(member.createdAt).toISOString() : null,
        is_active: true,
        last_synced_at: new Date().toISOString(),
        sync_source: 'bitjita'
      };

      const { error } = await supabase
        .from('settlement_members')
        .upsert(memberData, {
          onConflict: 'settlement_id,entity_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Failed to sync member ${member.userName}:`, error);
      } else {
        results.membersUpdated++;
      }
    }

    // Sync citizens
    for (const citizen of citizens) {
      const citizenData = {
        settlement_id: options.settlementId,
        entity_id: citizen.entityId,
        user_name: citizen.userName,
        skills: citizen.skills || {},
        total_skills: citizen.totalSkills || 0,
        highest_level: citizen.highestLevel || 0,
        total_level: citizen.totalLevel || 0,
        total_xp: citizen.totalXP || 0,
        last_synced_at: new Date().toISOString(),
        sync_source: 'bitjita'
      };

      const { error } = await supabase
        .from('settlement_citizens')
        .upsert(citizenData, {
          onConflict: 'settlement_id,entity_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Failed to sync citizen ${citizen.userName}:`, error);
      } else {
        results.citizensUpdated++;
      }
    }

    // Mark members as inactive if they're no longer in the roster
    const currentMemberIds = members.map(m => m.entityId);
    
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

    console.log(`✅ Member sync completed for ${options.settlementId}:`);
    console.log(`   Members: ${results.membersUpdated} synced`);
    console.log(`   Citizens: ${results.citizensUpdated} synced`);
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
  const supabase = createServerClient();
  
  if (!supabase) {
    throw new Error('Supabase client not available for bulk member sync');
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