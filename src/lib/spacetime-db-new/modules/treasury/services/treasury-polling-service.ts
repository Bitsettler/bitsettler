import { BitJitaAPI } from '../../integrations/bitjita-api';
import { createServerClient } from '../../../shared/supabase-client';

// Constants
const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const RETENTION_DAYS = 180; // 6 months

export interface TreasurySnapshot {
  settlementId: string;
  balance: number;
  previousBalance?: number;
  changeAmount?: number;
  supplies?: number;
  tier?: number;
  numTiles?: number;
  recordedAt: Date;
  dataSource: string;
}

export class TreasuryPollingService {
  private static instance: TreasuryPollingService;
  private isPolling: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private supabase: any;
  
  // Global flag to prevent multiple services across hot reloads
  private static globalPollingActive = false;

  private constructor() {
    this.supabase = createServerClient();
    if (!this.supabase) {
      console.error('❌ Treasury service requires service role client');
    }
  }

  static getInstance(): TreasuryPollingService {
    if (!TreasuryPollingService.instance) {
      TreasuryPollingService.instance = new TreasuryPollingService();
    }
    return TreasuryPollingService.instance;
  }

  /**
   * Start polling treasury data every 5 minutes
   */
  startPolling(settlementId: string): void {
    if (!settlementId) {
      console.error('❌ Settlement ID is required to start treasury polling');
      return;
    }
    // Check both instance and global flags to prevent multiple polling
    if (this.isPolling || TreasuryPollingService.globalPollingActive) {
      console.warn('Treasury polling already active - skipping duplicate start');
      return;
    }

    console.log('Starting treasury polling service - interval:', POLLING_INTERVAL);
    this.isPolling = true;
    TreasuryPollingService.globalPollingActive = true;

    // Run immediately
    this.pollTreasuryData(settlementId);

    // Then poll every 5 minutes
    this.intervalId = setInterval(() => {
      this.pollTreasuryData(settlementId);
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop the polling service
   */
  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
    TreasuryPollingService.globalPollingActive = false;
    console.log('Treasury polling service stopped');
  }

  /**
   * Manually trigger a treasury data poll
   */
  async pollTreasuryData(settlementId: string): Promise<TreasurySnapshot | null> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not available for treasury polling');
      return null;
    }

    try {
      console.log(`🏛️ Polling treasury data for settlement ${settlementId}...`);
      
      // Fetch current balance from BitJita
      const bitjitaResult = await BitJitaAPI.fetchSettlementDetails(settlementId);
      
      if (!bitjitaResult.success || !bitjitaResult.data) {
        console.error('❌ Failed to fetch BitJita settlement details:', bitjitaResult.error);
        return null;
      }

      const currentBalance = bitjitaResult.data.treasury;
      
      // Get the last recorded balance to calculate change
      const { data: lastRecord } = await this.supabase
        .from('treasury_history')
        .select('balance, recorded_at')
        .eq('settlement_id', settlementId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      const previousBalance = lastRecord?.balance || 0;
      const changeAmount = currentBalance - previousBalance;

      // Only record snapshots under specific conditions to avoid clutter:
      // 1. Significant balance change (>100 coins for better granularity)
      // 2. It's been more than 24 hours since last record (daily snapshot)
      // 3. No previous record exists
      const significantChange = Math.abs(changeAmount) >= 100; // Lowered from 1000 to 100
      const daysSinceLastRecord = lastRecord ? 
        (new Date().getTime() - new Date(lastRecord.recorded_at).getTime()) / (24 * 60 * 60 * 1000) : 999;
      
      const shouldRecord = !lastRecord || 
        significantChange || 
        daysSinceLastRecord >= 1;

      if (shouldRecord) {
        const snapshot: TreasurySnapshot = {
          settlementId,
          balance: currentBalance,
          previousBalance,
          changeAmount,
          supplies: bitjitaResult.data.supplies,
          tier: bitjitaResult.data.tier,
          numTiles: bitjitaResult.data.tiles,
          recordedAt: new Date(),
          dataSource: 'bitjita_polling'
        };

        // Insert the new record
        const { error } = await this.supabase
          .from('treasury_history')
          .insert({
            settlement_id: settlementId,
            balance: currentBalance,
            previous_balance: previousBalance,
            change_amount: changeAmount,
            recorded_at: snapshot.recordedAt.toISOString(),
            data_source: 'bitjita_polling',
            supplies: bitjitaResult.data.supplies,
            tier: bitjitaResult.data.tier,
            num_tiles: bitjitaResult.data.tiles
          });

        if (error) {
          console.error('❌ Failed to insert treasury history:', error);
          return null;
        }

        const reason = !lastRecord ? 'first record' : 
                      significantChange ? `significant change (${changeAmount >= 0 ? '+' : ''}${changeAmount})` :
                      'daily snapshot';
        console.log(`💰 Treasury snapshot recorded: ${currentBalance} (${reason})`);
        return snapshot;
      } else {
        // Only log skips for larger changes to reduce noise
        if (Math.abs(changeAmount) >= 50) {
          const skipReason = Math.abs(changeAmount) < 100 ? 
            `small change (${changeAmount >= 0 ? '+' : ''}${changeAmount})` : 
            `recent record (${daysSinceLastRecord.toFixed(1)}h ago)`;
          console.log(`📊 Treasury snapshot skipped: ${currentBalance} (${skipReason})`);
        }
        return null;
      }

    } catch (error) {
      console.error('❌ Error polling treasury data:', error);
      return null;
    }
  }

  /**
   * Ensure all established settlements have treasury polling active
   */
  async ensureEstablishedSettlementsPolling(): Promise<{
    success: boolean;
    settlementsProcessed: number;
    newPollingStarted: number;
    errors: string[];
  }> {
    if (!this.supabase) {
      return {
        success: false,
        settlementsProcessed: 0,
        newPollingStarted: 0,
        errors: ['Supabase client not available']
      };
    }

    try {
      console.log('🔍 Checking established settlements for treasury polling...');

      // Get all established settlements
      const { data: establishedSettlements, error: settlementsError } = await this.supabase
        .from('settlements')
        .select('id, name')
        .eq('is_established', true)
        .eq('is_active', true);

      if (settlementsError) {
        console.error('❌ Failed to fetch established settlements:', settlementsError);
        return {
          success: false,
          settlementsProcessed: 0,
          newPollingStarted: 0,
          errors: [settlementsError.message]
        };
      }

      if (!establishedSettlements || establishedSettlements.length === 0) {
        console.log('ℹ️ No established settlements found');
        return {
          success: true,
          settlementsProcessed: 0,
          newPollingStarted: 0,
          errors: []
        };
      }

      console.log(`📊 Found ${establishedSettlements.length} established settlements`);

      let newPollingStarted = 0;
      const errors: string[] = [];

      // Check each settlement for existing treasury history (indicates polling is active)
      for (const settlement of establishedSettlements) {
        try {
          // Check if settlement already has recent treasury history
          const { data: recentHistory, error: historyError } = await this.supabase
            .from('treasury_history')
            .select('recorded_at')
            .eq('settlement_id', settlement.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

          // If no history error or no recent history (older than 7 days), start polling
          const needsPolling = historyError || 
            !recentHistory || 
            (new Date().getTime() - new Date(recentHistory.recorded_at).getTime()) > (7 * 24 * 60 * 60 * 1000);

          if (needsPolling) {
            console.log(`🏛️ Starting treasury polling for ${settlement.name} (${settlement.id})`);
            
            const snapshot = await this.pollTreasuryData(settlement.id);
            if (snapshot) {
              newPollingStarted++;
              console.log(`✅ Treasury polling started for ${settlement.name}`);
            } else {
              errors.push(`Failed to start polling for ${settlement.name}`);
            }
          } else {
            console.log(`⏭️ ${settlement.name} already has recent treasury data`);
          }
        } catch (error) {
          const errorMsg = `Error processing ${settlement.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`📈 Treasury polling check complete: ${newPollingStarted} new, ${errors.length} errors`);

      return {
        success: true,
        settlementsProcessed: establishedSettlements.length,
        newPollingStarted,
        errors
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error in ensureEstablishedSettlementsPolling:', errorMsg);
      return {
        success: false,
        settlementsProcessed: 0,
        newPollingStarted: 0,
        errors: [errorMsg]
      };
    }
  }

  /**
   * Get treasury history for a settlement
   */
  async getTreasuryHistory(
    settlementId: string,
    timeRange: number = 30, // Changed from 7 to 30 days
    timeUnit: 'days' | 'months' = 'days'
  ): Promise<TreasurySnapshot[]> {
    if (!this.supabase) return [];

    try {
      const startDate = new Date();
      
      // Calculate start date based on time unit
      if (timeUnit === 'days') {
        startDate.setDate(startDate.getDate() - timeRange);
      } else {
        startDate.setMonth(startDate.getMonth() - timeRange);
      }

      const { data, error } = await this.supabase
        .from('treasury_history')
        .select('*')
        .eq('settlement_id', settlementId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

          if (error) {
      console.error('Failed to fetch treasury history:', error);
      return [];
    }

    console.log(`Fetched ${data?.length || 0} treasury snapshots`);

      return (data || []).map((record: { settlement_id: string; current_balance: number; total_income: number; total_expenses: number; last_transaction_date?: string; transaction_count: number }) => ({
        settlementId: record.settlement_id,
        balance: record.balance,
        previousBalance: record.previous_balance,
        changeAmount: record.change_amount,
        supplies: record.supplies,
        tier: record.tier,
        numTiles: record.num_tiles,
        recordedAt: new Date(record.recorded_at),
        dataSource: record.data_source
      }));

      } catch (error) {
    console.error('Error fetching treasury history:', error);
    return [];
  }
  }

  /**
   * Clean up old treasury history (older than 6 months)
   */
    async cleanupOldHistory(): Promise<void> {
    if (!this.supabase) return;
    
    try {
      const { error } = await this.supabase.rpc('cleanup_old_treasury_history');
      if (error) {
        console.error('❌ Failed to cleanup old treasury history:', error);
      } else {
        console.log('🧹 Cleaned up old treasury history');
      }
    } catch (error) {
      console.error('❌ Error during treasury history cleanup:', error);
    }
  }

  /**
   * Remove excessive snapshots - keep only significant changes and daily snapshots
   */
  async cleanupExcessiveSnapshots(settlementId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      console.log('🧹 Cleaning up excessive treasury snapshots...');
      
      // Get all snapshots ordered by time
      const { data: allSnapshots, error: fetchError } = await this.supabase
        .from('treasury_history')
        .select('*')
        .eq('settlement_id', settlementId)
        .order('recorded_at', { ascending: true });

      if (fetchError) {
        console.error('❌ Failed to fetch snapshots for cleanup:', fetchError);
        return;
      }

      if (!allSnapshots || allSnapshots.length <= 10) {
        console.log('📊 Not enough snapshots to clean up');
        return;
      }

      // Keep snapshots that meet our criteria
      const keepSnapshots: number[] = [];
      let lastKeptSnapshot: { timestamp: number; data: unknown } | null = null;

      for (const snapshot of allSnapshots) {
        const shouldKeep = !lastKeptSnapshot || // Keep first snapshot
          Math.abs(snapshot.balance - lastKeptSnapshot.balance) >= 1000 || // Significant change
          (new Date(snapshot.recorded_at).getTime() - new Date(lastKeptSnapshot.recorded_at).getTime()) >= (24 * 60 * 60 * 1000); // Daily interval

        if (shouldKeep) {
          keepSnapshots.push(snapshot.id);
          lastKeptSnapshot = snapshot;
        }
      }

      // Delete snapshots not in our keep list
      const idsToDelete = allSnapshots
        .filter(s => !keepSnapshots.includes(s.id))
        .map(s => s.id);

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await this.supabase
          .from('treasury_history')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error('❌ Failed to delete excessive snapshots:', deleteError);
        } else {
          console.log(`🧹 Cleaned up ${idsToDelete.length} excessive snapshots, kept ${keepSnapshots.length}`);
        }
      } else {
        console.log('📊 No excessive snapshots to clean up');
      }
    } catch (error) {
      console.error('❌ Error during excessive snapshot cleanup:', error);
    }
  }

  /**
   * Get current polling status
   */
  getStatus(): { isPolling: boolean; hasInterval: boolean } {
    return {
      isPolling: this.isPolling,
      hasInterval: this.intervalId !== null
    };
  }
}

// Export singleton instance
export const treasuryPollingService = TreasuryPollingService.getInstance(); 