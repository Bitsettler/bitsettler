/**
 * Settlement and Treasury interfaces for UI components
 * Replaces 'any' types with proper TypeScript interfaces
 */

/**
 * Core settlement data structure used across UI components
 */
export interface Settlement {
  id: string;
  name: string;
  tier?: number;
  treasury?: number;
  supplies?: number;
  tiles?: number;
  population?: number;
  
  // Metadata
  description?: string;
  established_date?: string;
  invite_code?: string;
  
  // Activity stats
  active_members?: number;
  total_members?: number;
  recent_activity?: number;
  
  // Configuration
  settings?: {
    public_visibility?: boolean;
    allow_applications?: boolean;
    require_approval?: boolean;
  };
}

/**
 * Treasury data for dashboard displays
 */
export interface Treasury {
  id: string;
  settlement_id: string;
  current_balance: number;
  total_income: number;
  total_expenses: number;
  
  // Recent activity
  recent_transactions?: TreasuryTransaction[];
  monthly_change?: number;
  last_transaction_date?: string;
  
  // Statistics
  stats?: {
    transaction_count: number;
    average_transaction_size: number;
    top_expense_category?: string;
    top_income_source?: string;
  };
}

/**
 * Treasury transaction for recent activity displays
 */
export interface TreasuryTransaction {
  id: string;
  settlement_id: string;
  type: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
  amount: number;
  description: string;
  category?: string;
  date: string;
  created_by?: string;
}

/**
 * Settlement establishment result data
 */
export interface SettlementEstablishmentResult {
  settlement: Settlement;
  invite_code: string;
  members: Array<{
    id: string;
    name: string;
    entity_id: string;
    settlement_id: string;
    skills?: Record<string, number>;
    permissions?: {
      inventory: boolean;
      build: boolean;
      officer: boolean;
      coOwner: boolean;
    };
  }>;
  sync_status: {
    members_imported: number;
    skills_imported: number;
    errors?: string[];
  };
}

/**
 * Settlement join/establishment callback data
 */
export interface SettlementConnectionData {
  settlement_id: string;
  settlement_name: string;
  character_id?: string;
  character_name?: string;
  success: boolean;
  message?: string;
}

/**
 * Settlement dashboard summary data
 */
export interface SettlementDashboardData {
  settlement: Settlement;
  treasury: Treasury;
  members: {
    total: number;
    active: number;
    recent_joins: number;
    top_contributors: Array<{
      name: string;
      contribution_score: number;
      recent_activity: string;
    }>;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    recent_updates: Array<{
      name: string;
      progress: number;
      last_updated: string;
    }>;
  };
  activity: {
    recent_events: Array<{
      type: string;
      description: string;
      timestamp: string;
      member?: string;
    }>;
  };
}

/**
 * Settlement search/selection result
 */
export interface SettlementSearchResult {
  id: string;
  name: string;
  tier: number;
  population: number;
  tiles: number;
  treasury: number;
  location?: string;
  description?: string;
}