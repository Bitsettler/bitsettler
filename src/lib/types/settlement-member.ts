/**
 * Database and API response interfaces for settlement members
 * Replaces 'any' types with proper TypeScript interfaces
 */

/**
 * Raw settlement member data from database queries
 * Used in various API endpoints that fetch member data
 */
export interface DatabaseSettlementMember {
  id: string;
  player_entity_id: string; // PRIMARY: Stable BitJita player character ID
  entity_id?: string;       // SECONDARY: Generic BitJita entity ID
  claim_entity_id?: string; // Settlement claim ID
  settlement_id: string;
  name: string;
  bitjita_user_id?: string;
  supabase_user_id?: string;
  
  // Skills and progression
  total_skills?: number;
  highest_level?: number;
  total_level?: number;
  total_xp?: number;
  skills?: Record<string, number>;
  
  // Permissions
  inventory_permission?: boolean | number;
  build_permission?: boolean | number;
  officer_permission?: boolean | number;
  co_owner_permission?: boolean | number;
  
  // Activity tracking
  last_active_at?: string;
  app_joined_at?: string;
  onboarding_completed_at?: string;
  
  // Profile data
  display_name?: string;
  discord_handle?: string;
  bio?: string;
  timezone?: string;
  avatar_url?: string;
  
  // System fields
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;

  last_login_timestamp?: string;
  joined_settlement_at?: string;
  sync_source?: string;

  is_claimed?: boolean;
  last_synced_at?: string;
}

/**
 * Formatted member for API responses
 * Standardized format used across different endpoints
 */
export interface ApiFormattedMember {
  id: string;
  player_entity_id: string; // PRIMARY: Stable BitJita player character ID  
  entity_id?: string;       // SECONDARY: Generic BitJita entity ID
  claim_entity_id?: string; // Settlement claim ID
  name: string;
  settlement_id: string;
  bitjita_user_id?: string;
  
  skills: Record<string, number>;
  total_level: number;
  
  permissions: {
    inventory: boolean;
    build: boolean;
    officer: boolean;
    coOwner: boolean;
  };
  
  activity: {
    lastActive?: Date;
    joinedApp?: Date;
    onboardingCompleted?: Date;
  };
  
  profile?: {
    displayName?: string;
    discordHandle?: string;
    bio?: string;
    timezone?: string;
    avatarUrl?: string;
  };
  
  isActive: boolean;
}

/**
 * Available character for claiming (used in establishment flow)
 */
export interface AvailableCharacter {
  id: string;
  name: string;
  settlement_id: string;
  player_entity_id: string; // PRIMARY: Stable BitJita player character ID
  entity_id?: string;       // SECONDARY: Generic BitJita entity ID
  claim_entity_id?: string; // Settlement claim ID
  bitjita_user_id?: string;
  
  skills: Record<string, number>;
  total_level: number;
  
  permissions: {
    inventory: boolean;
    build: boolean;
    officer: boolean;
    coOwner: boolean;
  };
}

/**
 * Settlement member for roster/dashboard views
 */
export interface RosterMember {
  id: string;
  playerEntityId: string; // PRIMARY: Stable BitJita player character ID
  entityId?: string;      // SECONDARY: Generic BitJita entity ID
  claimEntityId?: string; // Settlement claim ID
  name: string;
  profession: string;
  level: number;
  lastOnline?: Date;
  permissions: {
    inventory: boolean;
    build: boolean;
    officer: boolean;
    coOwner: boolean;
  };
  isActive: boolean;
}

/**
 * Member with skills data (detailed view)
 */
export interface MemberWithSkills extends ApiFormattedMember {
  detailedSkills: Array<{
    name: string;
    level: number;
    experience: number;
  }>;
}

/**
 * Transform database member to API format
 */
export function formatMemberForApi(dbMember: DatabaseSettlementMember): ApiFormattedMember {
  return {
    id: dbMember.id,
    player_entity_id: dbMember.player_entity_id,
    entity_id: dbMember.entity_id,
    claim_entity_id: dbMember.claim_entity_id,
    name: dbMember.name,
    settlement_id: dbMember.settlement_id,
    bitjita_user_id: dbMember.bitjita_user_id,
    
    skills: dbMember.skills || {},
    total_level: dbMember.total_level || 0,
    
    permissions: {
      inventory: Boolean(dbMember.inventory_permission),
      build: Boolean(dbMember.build_permission),
      officer: Boolean(dbMember.officer_permission),
      coOwner: Boolean(dbMember.co_owner_permission)
    },
    
    activity: {
      lastActive: dbMember.last_active_at ? new Date(dbMember.last_active_at) : undefined,
      joinedApp: dbMember.app_joined_at ? new Date(dbMember.app_joined_at) : undefined,
      onboardingCompleted: dbMember.onboarding_completed_at ? new Date(dbMember.onboarding_completed_at) : undefined
    },
    
    profile: dbMember.display_name || dbMember.discord_handle || dbMember.bio || dbMember.timezone || dbMember.avatar_url ? {
      displayName: dbMember.display_name,
      discordHandle: dbMember.discord_handle,
      bio: dbMember.bio,
      timezone: dbMember.timezone,
      avatarUrl: dbMember.avatar_url
    } : undefined,
    
    isActive: dbMember.is_active !== false
  };
}

/**
 * Transform database member to available character format
 */
export function formatAsAvailableCharacter(dbMember: DatabaseSettlementMember): AvailableCharacter {
  return {
    id: dbMember.player_entity_id,
    name: dbMember.name || 'Unknown Character',
    settlement_id: dbMember.settlement_id,
    player_entity_id: dbMember.player_entity_id,
    entity_id: dbMember.entity_id,
    claim_entity_id: dbMember.claim_entity_id,
    bitjita_user_id: dbMember.bitjita_user_id,
    
    skills: dbMember.skills || {},
    total_level: dbMember.total_level || 0,
    
    permissions: {
      inventory: Boolean(dbMember.inventory_permission),
      build: Boolean(dbMember.build_permission),
      officer: Boolean(dbMember.officer_permission),
      coOwner: Boolean(dbMember.co_owner_permission)
    }
  };
}