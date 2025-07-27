// Settlement Integration Configuration
// Centralized configuration for settlement management features

export const settlementConfig = {
  // Default settlement configuration
  defaultSettlement: {
    id: '', // Will be set via server-side configuration
    name: 'Port Taverna',
  },

  // BitJita API configuration
  bitjita: {
    baseUrl: 'https://bitjita.com/api',
    appIdentifier: 'PR3SIDENT/Bitcraft.guide',
    timeout: 30000, // 30 seconds
  },

  // Sync intervals (in hours)
  syncIntervals: {
    members: 0.5, // 30 minutes
    treasury: 0.083, // 5 minutes
    projects: 1, // 1 hour
  },

  // Batch processing settings
  batchSizes: {
    members: 10,
    toolbelts: 5,
    apiCalls: 5,
  },

  // Rate limiting delays (in milliseconds)
  delays: {
    betweenBatches: 1000, // 1 second
    betweenApiCalls: 200, // 200ms
    betweenToolbeltCalls: 2000, // 2 seconds
  },

  // Treasury settings
  treasury: {
    currencySymbol: '₡', // BitCraft currency symbol
    decimalPlaces: 2,
    defaultCategories: [
      'Project Revenue',
      'Member Dues', 
      'Trading',
      'Construction Costs',
      'Supplies',
      'Tools & Equipment',
      'Food & Provisions',
      'Crafting Materials',
      'Administrative',
      'Other Income',
      'Other Expenses',
    ],
  },

  // Feature flags
  features: {
    realTimeSync: true,
    memberToolbelts: false, // Disabled for core features focus
    advancedAnalytics: true,
    crossReferences: true, // Link to main item compendium
  },

  // UI settings
  ui: {
    itemsPerPage: 20,
    maxRecentProjects: 5,
    maxRecentMembers: 10,
    defaultProjectPriority: 3,
    defaultMemberRole: 'Contributor',
  },

  // Development settings
  dev: {
    enableDebugLogs: true, // Will be configured based on environment
    mockApiCalls: false,
    skipRealTimeSync: false,
  },
} as const;

// Environment validation (to be called server-side)
export function validateSettlementConfig(env?: Record<string, string | undefined>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!env) {
    return { isValid: false, errors: ['Environment variables not provided'] };
  }

  // Check for required environment variables
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Type definitions for settlement configuration
export interface SettlementInfo {
  id: string;
  name: string;
  tier?: number;
  treasury?: number;
  population?: number;
}

export interface SyncStatus {
  lastSync: Date | null;
  isRunning: boolean;
  recordsAdded: number;
  recordsUpdated: number;
  error: string | null;
}

export interface SettlementMember {
  id: string;
  bitjitaId: string;
  name: string;
  profession: string;
  professionLevel: number;
  lastOnline: Date | null;
  isActive: boolean;
}

export interface SettlementProject {
  id: string;
  name: string;
  description?: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  priority: 1 | 2 | 3 | 4 | 5;
  createdBy: string;
  createdAt: Date;
}

export interface ProjectItem {
  id: string;
  projectId: string;
  itemName: string;
  requiredQuantity: number;
  currentQuantity: number;
  tier: 1 | 2 | 3 | 4;
  status: 'Needed' | 'In Progress' | 'Completed';
  assignedMemberId?: string;
}

export interface TreasuryTransaction {
  id: string;
  type: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  transactionDate: Date;
  relatedProjectId?: string;
  relatedMemberId?: string;
} 