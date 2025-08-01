/**
 * Reusable component prop interfaces
 * Replaces 'any' types in component definitions
 */

/**
 * Game item for search/selection components
 */
export interface GameItem {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  tier?: number;
  value?: number;
  icon?: string;
  
  // Additional metadata
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  craftable?: boolean;
  stackable?: boolean;
  max_stack?: number;
}

/**
 * Settlement establishment/join callback data
 */
export interface SettlementJoinData {
  settlement_id: string;
  settlement_name: string;
  character_id?: string;
  character_name?: string;
  invite_code?: string;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface SettlementEstablishData {
  settlement_id: string;
  settlement_name: string;
  invite_code: string;
  character_id?: string;
  character_name?: string;
  member_count: number;
  success: boolean;
  message?: string;
  errors?: string[];
}

/**
 * Permission level configuration for UI display
 */
export interface PermissionDisplayConfig {
  label: string;
  color: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

/**
 * Sync result from API operations
 */
export interface SyncResult {
  success: boolean;
  operation: string;
  summary: {
    total_processed: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  errors?: Array<{
    type: string;
    message: string;
    details?: unknown;
  }>;
  warnings?: string[];
  timing: {
    start_time: string;
    end_time: string;
    duration_ms: number;
  };
}

/**
 * Notification data structure
 */
export interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    url?: string;
    callback?: () => void;
  };
  metadata?: Record<string, unknown>;
  expires_at?: string;
  seen?: boolean;
}