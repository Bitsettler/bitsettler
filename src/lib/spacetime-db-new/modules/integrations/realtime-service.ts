import { supabase, isSupabaseAvailable } from '../../shared/supabase-client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Real-time update types for different data changes
 */
export interface MemberStatusUpdate {
  id: string;
  name: string;
  last_online: string | null;
  is_active: boolean;
  profession: string;
  profession_level: number;
}

export interface TreasuryUpdate {
  id: string;
  transaction_type: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
  amount: number;
  description: string;
  transaction_date: string;
  category: string | null;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  item_name: string;
  current_quantity: number;
  required_quantity: number;
  status: 'Needed' | 'In Progress' | 'Completed';
}

export interface SettlementActivity {
  type: 'member_update' | 'treasury_update' | 'project_update';
  timestamp: Date;
  description: string;
  data: MemberStatusUpdate | TreasuryUpdate | ProjectUpdate;
}

/**
 * Event handlers for real-time updates
 */
export interface RealtimeEventHandlers {
  onMemberUpdate?: (update: MemberStatusUpdate) => void;
  onTreasuryUpdate?: (update: TreasuryUpdate) => void;
  onProjectUpdate?: (update: ProjectUpdate) => void;
  onActivityUpdate?: (activity: SettlementActivity) => void;
  onError?: (error: Error) => void;
}

/**
 * Settlement Real-Time Service
 * Manages WebSocket connections and live updates for settlement data
 */
export class SettlementRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private eventHandlers: RealtimeEventHandlers = {};
  private isConnected = false;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    this.setupGlobalErrorHandling();
  }

  /**
   * Initialize real-time subscriptions for settlement data
   */
  async initialize(handlers: RealtimeEventHandlers): Promise<void> {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available, real-time features disabled');
      return;
    }

    this.eventHandlers = handlers;

    try {
      await Promise.all([
        this.subscribeToMembers(),
        this.subscribeToTreasury(),
        this.subscribeToProjects()
      ]);

      this.isConnected = true;
      this.retryCount = 0;
      console.log('✅ Settlement real-time service initialized');
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Subscribe to member status updates
   */
  private async subscribeToMembers(): Promise<void> {
    const channel = supabase!
      .channel('settlement-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settlement_members'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleMemberUpdate(payload);
        }
      );

    await this.subscribeChannel('members', channel);
  }

  /**
   * Subscribe to treasury transaction updates
   */
  private async subscribeToTreasury(): Promise<void> {
    const channel = supabase!
      .channel('treasury-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treasury_transactions'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleTreasuryUpdate(payload);
        }
      );

    await this.subscribeChannel('treasury', channel);
  }

  /**
   * Subscribe to project item updates
   */
  private async subscribeToProjects(): Promise<void> {
    const channel = supabase!
      .channel('project-items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_items'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleProjectUpdate(payload);
        }
      );

    await this.subscribeChannel('projects', channel);
  }

  /**
   * Helper to subscribe to a channel with error handling
   */
  private async subscribeChannel(name: string, channel: RealtimeChannel): Promise<void> {
    return new Promise((resolve, reject) => {
      channel
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.channels.set(name, channel);
            console.log(`✅ Subscribed to ${name} real-time updates`);
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Failed to subscribe to ${name} updates`);
            reject(new Error(`Failed to subscribe to ${name}`));
          } else if (status === 'TIMED_OUT') {
            console.error(`⏰ Subscription to ${name} timed out`);
            reject(new Error(`Subscription to ${name} timed out`));
          }
        });
    });
  }

  /**
   * Handle member status updates
   */
  private handleMemberUpdate(payload: RealtimePostgresChangesPayload<any>): void {
    try {
      const record = payload.new || payload.old;
      if (!record) return;

      const memberUpdate: MemberStatusUpdate = {
        id: record.id,
        name: record.name,
        last_online: record.last_online,
        is_active: record.is_active,
        profession: record.profession,
        profession_level: record.profession_level
      };

      this.eventHandlers.onMemberUpdate?.(memberUpdate);

      // Create activity entry
      const activity: SettlementActivity = {
        type: 'member_update',
        timestamp: new Date(),
        description: this.getMemberUpdateDescription(payload.eventType, record),
        data: memberUpdate
      };

      this.eventHandlers.onActivityUpdate?.(activity);
    } catch (error) {
      console.error('Error handling member update:', error);
      this.eventHandlers.onError?.(error as Error);
    }
  }

  /**
   * Handle treasury transaction updates
   */
  private handleTreasuryUpdate(payload: RealtimePostgresChangesPayload<any>): void {
    try {
      const record = payload.new || payload.old;
      if (!record) return;

      const treasuryUpdate: TreasuryUpdate = {
        id: record.id,
        transaction_type: record.transaction_type,
        amount: record.amount,
        description: record.description,
        transaction_date: record.transaction_date,
        category: record.category
      };

      this.eventHandlers.onTreasuryUpdate?.(treasuryUpdate);

      // Create activity entry
      const activity: SettlementActivity = {
        type: 'treasury_update',
        timestamp: new Date(),
        description: this.getTreasuryUpdateDescription(payload.eventType, record),
        data: treasuryUpdate
      };

      this.eventHandlers.onActivityUpdate?.(activity);
    } catch (error) {
      console.error('Error handling treasury update:', error);
      this.eventHandlers.onError?.(error as Error);
    }
  }

  /**
   * Handle project item updates
   */
  private handleProjectUpdate(payload: RealtimePostgresChangesPayload<any>): void {
    try {
      const record = payload.new || payload.old;
      if (!record) return;

      const projectUpdate: ProjectUpdate = {
        id: record.id,
        project_id: record.project_id,
        item_name: record.item_name,
        current_quantity: record.current_quantity,
        required_quantity: record.required_quantity,
        status: record.status
      };

      this.eventHandlers.onProjectUpdate?.(projectUpdate);

      // Create activity entry
      const activity: SettlementActivity = {
        type: 'project_update',
        timestamp: new Date(),
        description: this.getProjectUpdateDescription(payload.eventType, record),
        data: projectUpdate
      };

      this.eventHandlers.onActivityUpdate?.(activity);
    } catch (error) {
      console.error('Error handling project update:', error);
      this.eventHandlers.onError?.(error as Error);
    }
  }

  /**
   * Generate human-readable descriptions for updates
   */
  private getMemberUpdateDescription(eventType: string, record: any): string {
    switch (eventType) {
      case 'INSERT':
        return `${record.name} joined the settlement`;
      case 'UPDATE':
        if (record.is_active === false) {
          return `${record.name} went offline`;
        } else if (record.last_online) {
          return `${record.name} came online`;
        }
        return `${record.name} updated their profile`;
      case 'DELETE':
        return `${record.name} left the settlement`;
      default:
        return `Member ${record.name} updated`;
    }
  }

  private getTreasuryUpdateDescription(eventType: string, record: any): string {
    const amount = Math.abs(record.amount);
    const type = record.transaction_type.toLowerCase();
    
    switch (eventType) {
      case 'INSERT':
        return `New ${type}: ${amount} gold - ${record.description}`;
      case 'UPDATE':
        return `Updated ${type}: ${amount} gold - ${record.description}`;
      case 'DELETE':
        return `Removed ${type}: ${amount} gold - ${record.description}`;
      default:
        return `Treasury ${type} updated`;
    }
  }

  private getProjectUpdateDescription(eventType: string, record: any): string {
    const progress = `${record.current_quantity}/${record.required_quantity}`;
    
    switch (eventType) {
      case 'INSERT':
        return `New project item: ${record.item_name} (${progress})`;
      case 'UPDATE':
        if (record.status === 'Completed') {
          return `✅ Completed: ${record.item_name}`;
        }
        return `Updated: ${record.item_name} (${progress})`;
      case 'DELETE':
        return `Removed project item: ${record.item_name}`;
      default:
        return `Project item ${record.item_name} updated`;
    }
  }

  /**
   * Setup global error handling for real-time connections
   */
  private setupGlobalErrorHandling(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.isConnected) {
          console.log('🌐 Network reconnected, attempting to restore real-time connections');
          this.reconnect();
        }
      });

      window.addEventListener('offline', () => {
        console.log('📡 Network disconnected, real-time updates paused');
        this.isConnected = false;
      });
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private handleConnectionError(error: Error): void {
    this.isConnected = false;
    this.eventHandlers.onError?.(error);

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Retrying real-time connection (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms`);
      
      setTimeout(() => {
        this.reconnect();
      }, this.retryDelay);
    } else {
      console.error('❌ Max retries exceeded, real-time updates disabled');
    }
  }

  /**
   * Reconnect to real-time subscriptions
   */
  private async reconnect(): Promise<void> {
    await this.disconnect();
    await this.initialize(this.eventHandlers);
  }

  /**
   * Disconnect from all real-time subscriptions
   */
  async disconnect(): Promise<void> {
    for (const [name, channel] of this.channels) {
      try {
        await supabase?.removeChannel(channel);
        console.log(`🔌 Disconnected from ${name} real-time updates`);
      } catch (error) {
        console.error(`Error disconnecting from ${name}:`, error);
      }
    }
    
    this.channels.clear();
    this.isConnected = false;
  }

  /**
   * Check if the service is connected and active
   */
  isActive(): boolean {
    return this.isConnected && isSupabaseAvailable();
  }

  /**
   * Get current connection status
   */
  getStatus(): {
    connected: boolean;
    channels: string[];
    retryCount: number;
  } {
    return {
      connected: this.isConnected,
      channels: Array.from(this.channels.keys()),
      retryCount: this.retryCount
    };
  }
}

// Singleton instance for the entire application
export const settlementRealtimeService = new SettlementRealtimeService(); 