/**
 * Settlement Member Types - Version 2
 * 
 * Updated types that clearly separate settlement membership from activity status.
 * Phase 1: Use alongside existing types
 * Phase 2: Replace existing settlement member types
 */

import { ActivityStatus } from '@/lib/utils/member-activity';

/**
 * Enhanced settlement member with clear activity separation
 */
export interface SettlementMemberV2 {
  // Core identification
  id: string;
  settlement_id: string;
  player_entity_id: string; // PRIMARY: Stable BitJita player character ID
  entity_id?: string;       // SECONDARY: Generic BitJita entity ID
  claim_entity_id?: string; // Settlement claim ID
  name: string;
  
  // Skills data
  skills: Record<string, number>;
  total_skills: number;
  highest_level: number;
  total_level: number;
  total_xp: number;
  
  // Permissions (unchanged)
  inventory_permission: number;
  build_permission: number;
  officer_permission: number;
  co_owner_permission: number;
  
  // CLEAR SEPARATION: Settlement vs Activity
  settlement_status: {
    is_in_settlement: boolean;           // Currently in settlement (will be is_active after Phase 2)
    joined_settlement_at: string | null; // When they joined
    last_synced_at: string;              // When we last synced with BitJita
  };
  
  activity_status: {
    last_login_timestamp: string | null; // When they last logged into game
    is_recently_active: boolean;         // Logged in last 7 days
    activity_level: ActivityStatus;      // Detailed activity status
    days_since_login: number | null;     // Days since last login
  };
  
  // App user data (if claimed)
  app_user?: {
    supabase_user_id: string;
    bitjita_user_id?: string;
    display_name?: string;
    discord_handle?: string;
    bio?: string;
    timezone?: string;
    preferred_contact: 'discord' | 'in-game' | 'app';
    theme: 'light' | 'dark' | 'system';
    profile_color: string;
    app_joined_at?: string;
    app_last_active_at?: string;
  };
  
  // Timestamps
  created_at: string;
}

/**
 * API request parameters for member queries
 */
export interface MemberQueryParamsV2 {
  // Settlement filtering
  settlement_id: string;
  include_former_members?: boolean;     // Include members no longer in settlement
  
  // Activity filtering  
  activity_filter?: 'all' | 'recently_active' | 'inactive' | 'never_logged_in';
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Other filters
  profession_filter?: string;
  permission_filter?: 'officers' | 'builders' | 'all';
  claimed_only?: boolean;               // Only show claimed characters
}

/**
 * API response for member lists
 */
export interface MemberListResponseV2 {
  members: SettlementMemberV2[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  analytics: {
    total_members: number;              // Total in settlement
    recently_active_members: number;    // Logged in last 7 days
    claimed_members: number;            // Have app accounts
    officers: number;
    co_owners: number;
  };
}

/**
 * Backward compatibility: Transform V2 to current format
 */
export function memberV2ToLegacy(memberV2: SettlementMemberV2): any {
  return {
    id: memberV2.id,
    settlement_id: memberV2.settlement_id,
    player_entity_id: memberV2.player_entity_id,
    entity_id: memberV2.entity_id,
    claim_entity_id: memberV2.claim_entity_id,
    name: memberV2.name,
    
    skills: memberV2.skills,
    total_skills: memberV2.total_skills,
    highest_level: memberV2.highest_level,
    total_level: memberV2.total_level,
    total_xp: memberV2.total_xp,
    
    inventory_permission: memberV2.inventory_permission,
    build_permission: memberV2.build_permission,
    officer_permission: memberV2.officer_permission,
    co_owner_permission: memberV2.co_owner_permission,
    
    // Map new structure to old fields
    is_active: memberV2.settlement_status.is_in_settlement,
    last_login_timestamp: memberV2.activity_status.last_login_timestamp,
    joined_settlement_at: memberV2.settlement_status.joined_settlement_at,
    last_synced_at: memberV2.settlement_status.last_synced_at,
    
    // App user data
    supabase_user_id: memberV2.app_user?.supabase_user_id || null,
    bitjita_user_id: memberV2.app_user?.bitjita_user_id || null,
    display_name: memberV2.app_user?.display_name || null,
    discord_handle: memberV2.app_user?.discord_handle || null,
    bio: memberV2.app_user?.bio || null,
    timezone: memberV2.app_user?.timezone || null,
    preferred_contact: memberV2.app_user?.preferred_contact || 'discord',
    theme: memberV2.app_user?.theme || 'system',
    profile_color: memberV2.app_user?.profile_color || '#3b82f6',
    app_joined_at: memberV2.app_user?.app_joined_at || null,
    app_last_active_at: memberV2.app_user?.app_last_active_at || null,
    
    created_at: memberV2.created_at,
    
    // Add computed activity fields for UI compatibility
    recently_active: memberV2.activity_status.is_recently_active,
    activity_status: memberV2.activity_status.activity_level,
    days_since_login: memberV2.activity_status.days_since_login,
  };
}

/**
 * Transform legacy format to V2
 */
export function legacyToMemberV2(legacyMember: any): SettlementMemberV2 {
  return {
    id: legacyMember.id,
    settlement_id: legacyMember.settlement_id,
    player_entity_id: legacyMember.player_entity_id,
    entity_id: legacyMember.entity_id,
    claim_entity_id: legacyMember.claim_entity_id,
    name: legacyMember.name,
    
    skills: legacyMember.skills || {},
    total_skills: legacyMember.total_skills || 0,
    highest_level: legacyMember.highest_level || 0,
    total_level: legacyMember.total_level || 0,
    total_xp: legacyMember.total_xp || 0,
    
    inventory_permission: legacyMember.inventory_permission || 0,
    build_permission: legacyMember.build_permission || 0,
    officer_permission: legacyMember.officer_permission || 0,
    co_owner_permission: legacyMember.co_owner_permission || 0,
    
    settlement_status: {
      is_in_settlement: legacyMember.is_active === true,
      joined_settlement_at: legacyMember.joined_settlement_at,
      last_synced_at: legacyMember.last_synced_at,
    },
    
    activity_status: {
      last_login_timestamp: legacyMember.last_login_timestamp,
      is_recently_active: legacyMember.recently_active || false,
      activity_level: legacyMember.activity_status || 'never_logged_in',
      days_since_login: legacyMember.days_since_login,
    },
    
    app_user: legacyMember.supabase_user_id ? {
      supabase_user_id: legacyMember.supabase_user_id,
      bitjita_user_id: legacyMember.bitjita_user_id,
      display_name: legacyMember.display_name,
      discord_handle: legacyMember.discord_handle,
      bio: legacyMember.bio,
      timezone: legacyMember.timezone,
      preferred_contact: legacyMember.preferred_contact || 'discord',
      theme: legacyMember.theme || 'system',
      profile_color: legacyMember.profile_color || '#3b82f6',
      app_joined_at: legacyMember.app_joined_at,
      app_last_active_at: legacyMember.app_last_active_at,
    } : undefined,
    
    created_at: legacyMember.created_at,
  };
}
