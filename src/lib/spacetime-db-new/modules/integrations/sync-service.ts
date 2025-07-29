import { supabase } from '../../shared/supabase-client';
import { BitJitaAPI } from './bitjita-api';
import { syncSettlementsMaster } from '../settlements/commands/sync-settlements-master';
import { syncAllSettlementMembers } from '../settlements/commands/sync-settlement-members';

// Configuration for sync intervals
const SYNC_CONFIG = {
  membersInterval: 30, // Sync members every 30 minutes  
  treasuryInterval: 5, // Sync treasury every 5 minutes
  settlementStatsInterval: 15, // Sync settlement stats every 15 minutes
  settlementsListInterval: 30, // Sync settlements master list every 30 minutes
};

/**
 * Settlement Data Sync Service
 * Orchestrates automatic synchronization with BitJita API
 */
export class SettlementSyncService {
  private intervalIds: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private config = SYNC_CONFIG;

  /**
   * Start all sync services with their respective intervals
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('SettlementSyncService is already running');
      return;
    }

    if (!supabase) {
      console.warn('Supabase not available, sync service cannot start');
      return;
    }

    console.log('Starting SettlementSyncService...');
    this.isRunning = true;

    // Start all sync intervals
    this.startMembersSync();
    this.startTreasurySync();
    this.startSettlementStatsSync();
    this.startSettlementsMasterSync();

    console.log('SettlementSyncService started successfully');
  }

  /**
   * Stop all sync services
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isRunning) {
        resolve();
        return;
      }

      console.log('Stopping SettlementSyncService...');

      // Clear all intervals
      for (const [name, intervalId] of this.intervalIds) {
        clearInterval(intervalId);
        console.log(`Stopped ${name} sync interval`);
      }

      this.intervalIds.clear();
      this.isRunning = false;
      console.log('SettlementSyncService stopped');
      resolve();
    });
  }

  /**
   * Manually trigger a full sync of all data
   */
  public async syncAll(): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not available for sync');
    }

    console.log('Starting full settlement data sync...');
    
    try {
      await Promise.allSettled([
        this.syncMembers(),
        this.syncTreasuryData(),
        this.syncSettlementStats(),
        this.syncSettlementsMaster(),
      ]);
      
      console.log('Full settlement sync completed');
    } catch (error) {
      console.error('Error during full sync:', error);
      throw error;
    }
  }

  /**
   * Get sync service status
   */
  public getStatus(): { running: boolean; activeIntervals: string[] } {
    return {
      running: this.isRunning,
      activeIntervals: Array.from(this.intervalIds.keys()),
    };
  }

  // =============================================================================
  // PRIVATE SYNC METHODS
  // =============================================================================

  /**
   * Start periodic settlements master list synchronization
   */
  private startSettlementsMasterSync(): void {
    if (this.intervalIds.has('settlementsMaster')) {
      return;
    }

    // Sync immediately on start
    this.syncSettlementsMaster();

    // Then sync every 30 minutes
    const intervalId = setInterval(() => {
      this.syncSettlementsMaster();
    }, this.config.settlementsListInterval * 60 * 1000);

    this.intervalIds.set('settlementsMaster', intervalId);
    console.log(`Settlements master list sync scheduled every ${this.config.settlementsListInterval} minutes`);
  }

  /**
   * Start periodic member synchronization
   */
  private startMembersSync(): void {
    if (this.intervalIds.has('members')) {
      return;
    }

    // Sync immediately on start
    this.syncMembers();

    // Then sync every 30 minutes
    const intervalId = setInterval(() => {
      this.syncMembers();
    }, this.config.membersInterval * 60 * 1000);

    this.intervalIds.set('members', intervalId);
    console.log(`Members sync scheduled every ${this.config.membersInterval} minutes`);
  }

  /**
   * Start periodic settlement stats synchronization
   */
  private startSettlementStatsSync(): void {
    if (this.intervalIds.has('settlementStats')) {
      return;
    }

    // Sync immediately on start
    this.syncSettlementStats();

    // Then sync every 15 minutes
    const intervalId = setInterval(() => {
      this.syncSettlementStats();
    }, this.config.settlementStatsInterval * 60 * 1000);

    this.intervalIds.set('settlementStats', intervalId);
    console.log(`Settlement stats sync scheduled every ${this.config.settlementStatsInterval} minutes`);
  }

  /**
   * Start periodic treasury synchronization
   */
  private startTreasurySync(): void {
    if (this.intervalIds.has('treasury')) {
      return;
    }

    // Sync immediately on start
    this.syncTreasuryData();

    // Then sync every 5 minutes
    const intervalId = setInterval(() => {
      this.syncTreasuryData();
    }, this.config.treasuryInterval * 60 * 1000);

    this.intervalIds.set('treasury', intervalId);
    console.log(`Treasury sync scheduled every ${this.config.treasuryInterval} minutes`);
  }

  /**
   * Sync settlements master list from BitJita API
   */
  private async syncSettlementsMaster(): Promise<void> {
    const syncKey = 'settlementsMaster';
    
    try {
      console.log('Syncing settlements master list...');
      
      const result = await syncSettlementsMaster();
      
      if (result.success) {
        console.log(`✅ Settlements master sync successful: ${result.settlementsFound} found, ${result.settlementsAdded} added, ${result.settlementsUpdated} updated`);
      } else {
        console.error('❌ Settlements master sync failed:', result.error);
        await this.handleSyncError(syncKey, () => this.syncSettlementsMaster());
      }
      
    } catch (error) {
      console.error('Error syncing settlements master list:', error);
      await this.handleSyncError(syncKey, () => this.syncSettlementsMaster());
    }
  }

  /**
   * Sync settlement members from BitJita API using the new sync command
   */
  private async syncMembers(): Promise<void> {
    const syncKey = 'members';
    
    try {
      console.log('Syncing settlement members for all active settlements...');
      
      const result = await syncAllSettlementMembers('scheduled');
      
      if (result.success) {
        console.log(`✅ Settlement members sync successful: ${result.totalMembers} members, ${result.totalCitizens} citizens synced across ${result.settlementsProcessed} settlements`);
      } else {
        console.warn(`⚠️  Settlement members sync completed with errors: ${result.errors.length} failures`);
        result.errors.forEach(error => console.error(`   - ${error}`));
      }
      
    } catch (error) {
      console.error('Error syncing settlement members:', error);
      await this.handleSyncError(syncKey, () => this.syncMembers());
    }
  }

  /**
   * Sync treasury data from BitJita API
   */
  private async syncTreasuryData(): Promise<void> {
    const syncKey = 'treasury';
    
    try {
      // TODO: Implement treasury sync when BitJita provides treasury endpoints
      console.log('Treasury sync placeholder - BitJita treasury API not yet available');
      
    } catch (error) {
      console.error('Error syncing treasury data:', error);
      await this.handleSyncError(syncKey, () => this.syncTreasuryData());
    }
  }

  /**
   * Sync settlement statistics from BitJita API
   */
  private async syncSettlementStats(): Promise<void> {
    const syncKey = 'settlementStats';
    
    try {
      console.log('Syncing settlement statistics...');
      
      // Get current settlement ID
      const defaultSettlementId = '504403158277057776'; // Port Taverna for now
      
      // Fetch settlement details for stats
      const details = await BitJitaAPI.fetchSettlementDetails(defaultSettlementId);
      
      if (details.success && details.data) {
        // Placeholder for future settlement stats sync
        console.log('Settlement stats sync placeholder - will be implemented when BitJita adds more endpoints');
      } else {
        console.error('Error fetching settlement details for stats:', details.error);
      }
      
    } catch (error) {
      console.error('Error syncing settlement stats:', error);
      await this.handleSyncError(syncKey, () => this.syncSettlementStats());
    }
  }

  /**
   * Handle sync errors with exponential backoff
   */
  private async handleSyncError(syncKey: string, retryFunction: () => Promise<void>): Promise<void> {
    // For now, just log the error
    // TODO: Implement exponential backoff retry logic
    console.error(`Sync error for ${syncKey}, will retry on next scheduled interval`);
  }
}

// Export singleton instance
export const settlementSyncService = new SettlementSyncService(); 