import { supabase } from '../../../shared/supabase-client';
import { BitJitaAPI } from '../../integrations/bitjita-api';

export interface SettlementSyncResult {
  success: boolean;
  settlementsFound: number;
  settlementsAdded: number;
  settlementsUpdated: number;
  settlementsDeactivated: number;
  syncDurationMs: number;
  apiCallsMade: number;
  error?: string;
}

/**
 * Sync master settlements list from BitJita API to local database
 * This enables fast local search without hitting BitJita API for every search
 * 
 * @param mode - 'full' for complete sync, 'incremental' for checking just new settlements
 */
export async function syncSettlementsMaster(mode: 'full' | 'incremental' = 'full'): Promise<SettlementSyncResult> {
  const startTime = Date.now();
  let settlementsAdded = 0;
  let settlementsUpdated = 0;
  let settlementsDeactivated = 0;
  
  try {
    if (!supabase) {
      console.warn('Supabase not available, skipping settlements master sync');
      return {
        success: false,
        settlementsFound: 0,
        settlementsAdded: 0,
        settlementsUpdated: 0,
        settlementsDeactivated: 0,
        syncDurationMs: Date.now() - startTime,
        apiCallsMade: 0,
        error: 'Supabase not available'
      };
    }

    console.log('🔄 Starting settlements master list sync...');
    
    // Fetch settlements from BitJita (full or incremental mode)
    const fetchResult = await BitJitaAPI.fetchAllSettlementsForSync(mode);
    
    if (!fetchResult.success || !fetchResult.data) {
      throw new Error(fetchResult.error || 'Failed to fetch settlements from BitJita');
    }

    const { settlements, totalFound, queriesUsed } = fetchResult.data;
    const apiCallsMade = queriesUsed.length;
    
    console.log(`📊 Processing ${totalFound} settlements from BitJita...`);

    // Get all existing settlements to compare
    const { data: existingSettlements, error: fetchError } = await supabase
      .from('settlements_master')
      .select('id, name, tier, treasury, supplies, tiles, population, last_synced_at');

    if (fetchError) {
      throw new Error(`Failed to fetch existing settlements: ${fetchError.message}`);
    }

    const existingSettlementsMap = new Map(
      (existingSettlements || []).map(s => [s.id, s])
    );

    // Track which settlements we've seen (to mark others as inactive)
    const seenSettlementIds = new Set<string>();

    // Process settlements in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < settlements.length; i += BATCH_SIZE) {
      const batch = settlements.slice(i, i + BATCH_SIZE);
      
      for (const settlement of batch) {
        seenSettlementIds.add(settlement.id);
        
        // Use UPSERT with ON CONFLICT DO UPDATE to handle both insert and update efficiently
        const { error: upsertError } = await supabase
          .from('settlements_master')
          .upsert({
            // Core settlement data
            id: settlement.id,
            name: settlement.name,
            name_normalized: settlement.name.toLowerCase(),
            tier: settlement.tier,
            treasury: settlement.treasury,
            supplies: settlement.supplies,
            tiles: settlement.tiles,
            population: settlement.population,
            
            // Rich BitJita data (now that we're storing everything)
            building_maintenance: settlement.buildingMaintenance,
            location_x: settlement.locationX,
            location_z: settlement.locationZ,
            location_dimension: settlement.locationDimension,
            region_id: settlement.regionId,
            region_name: settlement.regionName,
            owner_player_entity_id: settlement.ownerPlayerEntityId,
            owner_building_entity_id: settlement.ownerBuildingEntityId,
            neutral: settlement.neutral,
            learned_techs: settlement.learned,
            researching: settlement.researching,
            research_start_timestamp: settlement.startTimestamp,
            bitjita_created_at: settlement.createdAt,
            bitjita_updated_at: settlement.updatedAt,
            
            // Our metadata
            last_synced_at: new Date().toISOString(),
            is_active: true,
            sync_source: 'bitjita',
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id' 
          });

        if (upsertError) {
          console.error(`Error upserting settlement ${settlement.name}:`, upsertError);
        } else {
          // Determine if this was an insert or update by checking if it existed before
          const existing = existingSettlementsMap.get(settlement.id);
          if (existing) {
            settlementsUpdated++;
          } else {
            settlementsAdded++;
          }
        }
      }
      
      // Small delay between batches
      if (i + BATCH_SIZE < settlements.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Mark settlements as inactive if they weren't found in this sync
    // (Only mark as inactive if they haven't been synced in the last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: outdatedSettlements, error: outdatedError } = await supabase
      .from('settlements_master')
      .select('id')
      .eq('is_active', true)
      .lt('last_synced_at', oneHourAgo)
      .not('id', 'in', `(${Array.from(seenSettlementIds).map(id => `'${id}'`).join(',')})`);

    if (!outdatedError && outdatedSettlements && outdatedSettlements.length > 0) {
      const { error: deactivateError } = await supabase
        .from('settlements_master')
        .update({ is_active: false })
        .in('id', outdatedSettlements.map(s => s.id));

      if (!deactivateError) {
        settlementsDeactivated = outdatedSettlements.length;
      }
    }

    const syncDurationMs = Date.now() - startTime;
    
    // Log the sync operation
    await supabase.from('settlements_sync_log').insert({
      sync_type: 'full_sync',
      settlements_found: totalFound,
      settlements_added: settlementsAdded,
      settlements_updated: settlementsUpdated,
      settlements_deactivated: settlementsDeactivated,
      sync_duration_ms: syncDurationMs,
      api_calls_made: apiCallsMade,
      success: true,
      triggered_by: 'sync_service',
      bitjita_query: `Used ${queriesUsed.length} search terms`
    });

    console.log(`✅ Settlements master sync completed in ${syncDurationMs}ms:`);
    console.log(`   📊 Found: ${totalFound} settlements`);
    console.log(`   ➕ Added: ${settlementsAdded} new settlements`);
    console.log(`   📝 Updated: ${settlementsUpdated} existing settlements`);
    console.log(`   ❌ Deactivated: ${settlementsDeactivated} outdated settlements`);
    console.log(`   🌐 API calls: ${apiCallsMade}`);

    return {
      success: true,
      settlementsFound: totalFound,
      settlementsAdded,
      settlementsUpdated,
      settlementsDeactivated,
      syncDurationMs,
      apiCallsMade
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const syncDurationMs = Date.now() - startTime;
    
    console.error('Error syncing settlements master list:', errorMessage);
    
    // Log the failed sync operation
    if (supabase) {
      await supabase.from('settlements_sync_log').insert({
        sync_type: 'full_sync',
        success: false,
        error_message: errorMessage,
        sync_duration_ms: syncDurationMs,
        triggered_by: 'sync_service'
      });
    }
    
    return {
      success: false,
      settlementsFound: 0,
      settlementsAdded,
      settlementsUpdated,
      settlementsDeactivated,
      syncDurationMs,
      apiCallsMade: 0,
      error: errorMessage
    };
  }
} 