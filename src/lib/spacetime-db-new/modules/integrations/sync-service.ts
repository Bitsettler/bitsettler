import { BitJitaAPI } from './bitjita-api';
import { type SettlementMember } from '../settlements/commands';
import { supabase, isSupabaseAvailable } from '../../shared/supabase-client';

/**
 * Configuration for the sync service
 */
interface SyncConfig {
  membersSyncInterval: number; // minutes
  treasurySyncInterval: number; // minutes
  settlementStatsInterval: number; // minutes
  maxRetries: number;
  retryDelay: number; // seconds
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  membersSyncInterval: 30,     // Sync members every 30 minutes
  treasurySyncInterval: 5,     // Sync treasury every 5 minutes
  settlementStatsInterval: 15, // Sync settlement stats every 15 minutes
  maxRetries: 3,
  retryDelay: 30,
};

/**
 * Settlement Data Sync Service
 * Orchestrates real-time synchronization with BitJita API
 */
export class SettlementSyncService {
  private config: SyncConfig;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private isRunning = false;

  constructor(config?: Partial<SyncConfig>) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
  }

  /**
   * Start the sync service with all configured intervals
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('SettlementSyncService is already running');
      return;
    }

    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available, sync service cannot start');
      return;
    }

    console.log('Starting SettlementSyncService...');
    this.isRunning = true;

    // Start periodic sync operations
    this.startMembersSync();
    this.startTreasurySync();
    this.startStatsSync();

    console.log('SettlementSyncService started successfully');
  }

  /**
   * Stop the sync service and clear all intervals
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping SettlementSyncService...');
    
    // Clear all intervals
    this.syncIntervals.forEach(interval => clearInterval(interval));
    this.syncIntervals.clear();
    
    // Clear retry attempts
    this.retryAttempts.clear();
    
    this.isRunning = false;
    console.log('SettlementSyncService stopped');
  }

  /**
   * Manually trigger a full sync of all data
   */
  public async syncAll(): Promise<void> {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabase not available for sync');
    }

    console.log('Starting full settlement data sync...');
    
    try {
      await Promise.allSettled([
        this.syncMembers(),
        this.syncTreasuryData(),
        this.syncSettlementStats(),
      ]);
      
      console.log('Full settlement sync completed');
    } catch (error) {
      console.error('Error during full sync:', error);
      throw error;
    }
  }

  /**
   * Start periodic members synchronization
   */
  private startMembersSync(): void {
    const intervalMs = this.config.membersSyncInterval * 60 * 1000;
    
    // Immediate sync
    this.syncMembers();
    
    // Set up interval
    const interval = setInterval(() => {
      this.syncMembers();
    }, intervalMs);
    
    this.syncIntervals.set('members', interval);
    console.log(`Members sync scheduled every ${this.config.membersSyncInterval} minutes`);
  }

  /**
   * Start periodic treasury synchronization
   */
  private startTreasurySync(): void {
    const intervalMs = this.config.treasurySyncInterval * 60 * 1000;
    
    // Immediate sync
    this.syncTreasuryData();
    
    // Set up interval
    const interval = setInterval(() => {
      this.syncTreasuryData();
    }, intervalMs);
    
    this.syncIntervals.set('treasury', interval);
    console.log(`Treasury sync scheduled every ${this.config.treasurySyncInterval} minutes`);
  }

  /**
   * Start periodic settlement stats synchronization
   */
  private startStatsSync(): void {
    const intervalMs = this.config.settlementStatsInterval * 60 * 1000;
    
    // Immediate sync
    this.syncSettlementStats();
    
    // Set up interval
    const interval = setInterval(() => {
      this.syncSettlementStats();
    }, intervalMs);
    
    this.syncIntervals.set('stats', interval);
    console.log(`Settlement stats sync scheduled every ${this.config.settlementStatsInterval} minutes`);
  }

  /**
   * Sync settlement members from BitJita API
   */
  private async syncMembers(): Promise<void> {
    const syncKey = 'members';
    
    try {
      console.log('Syncing settlement members...');
      
      // Fetch settlement roster from BitJita API
      const settlementId = 'main-settlement'; // Configure this appropriately
      const rosterResponse = await BitJitaAPI.fetchSettlementRoster(settlementId);
      
      if (!rosterResponse.success || !rosterResponse.data?.members) {
        console.log('No member data received from BitJita API');
        return;
      }

      // Process and upsert each member
      let syncedCount = 0;
      for (const memberData of rosterResponse.data.members) {
        try {
          // Upsert member data directly to database
          const { error } = await supabase!
            .from('settlement_members')
            .upsert({
              id: memberData.entityId,
              name: memberData.userName,
              join_date: memberData.createdAt,
              last_seen: memberData.lastLoginTimestamp || null,
              is_active: true,
              contribution_score: 0,
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.error(`Error syncing member ${memberData.entityId}:`, error);
          } else {
            syncedCount++;
          }
          
        } catch (memberError) {
          console.error(`Error syncing member ${memberData.entityId}:`, memberError);
        }
      }

      console.log(`Successfully synced ${syncedCount} settlement members`);
      this.retryAttempts.delete(syncKey);
      
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
      console.log('Syncing treasury data...');
      
      // Note: BitJita API doesn't currently provide treasury data
      // This is a placeholder for future BitJita treasury integration
      console.log('Treasury sync not yet available from BitJita API');
      
      // Treasury sync will be implemented when BitJita adds treasury endpoints
      this.retryAttempts.delete(syncKey);
      
    } catch (error) {
      console.error('Error syncing treasury data:', error);
      await this.handleSyncError(syncKey, () => this.syncTreasuryData());
    }
  }

  /**
   * Sync settlement statistics from BitJita API
   */
  private async syncSettlementStats(): Promise<void> {
    const syncKey = 'stats';
    
    try {
      console.log('Syncing settlement statistics...');
      
      // Note: Use BitJita API to get settlement details
      const settlementId = 'main-settlement'; // Configure this appropriately
      // BitJita doesn't have a single settlement info endpoint yet
      // For now, we'll aggregate from available endpoints
      
      // Placeholder for future settlement stats sync
      console.log('Settlement stats sync placeholder - will be implemented when BitJita adds more endpoints');
      
      this.retryAttempts.delete(syncKey);
      
    } catch (error) {
      console.error('Error syncing settlement stats:', error);
      await this.handleSyncError(syncKey, () => this.syncSettlementStats());
    }
  }

  /**
   * Handle sync errors with retry logic
   */
  private async handleSyncError(syncKey: string, retryFn: () => Promise<void>): Promise<void> {
    const currentAttempts = this.retryAttempts.get(syncKey) || 0;
    
    if (currentAttempts < this.config.maxRetries) {
      this.retryAttempts.set(syncKey, currentAttempts + 1);
      
      console.log(`Retrying ${syncKey} sync in ${this.config.retryDelay} seconds (attempt ${currentAttempts + 1}/${this.config.maxRetries})`);
      
      setTimeout(async () => {
        await retryFn();
      }, this.config.retryDelay * 1000);
    } else {
      console.error(`Max retries reached for ${syncKey} sync, giving up`);
      this.retryAttempts.delete(syncKey);
    }
  }

  /**
   * Get the current status of the sync service
   */
  public getStatus(): {
    isRunning: boolean;
    intervals: string[];
    retryAttempts: Record<string, number>;
  } {
    return {
      isRunning: this.isRunning,
      intervals: Array.from(this.syncIntervals.keys()),
      retryAttempts: Object.fromEntries(this.retryAttempts),
    };
  }
}

// Export a singleton instance
export const settlementSyncService = new SettlementSyncService(); 