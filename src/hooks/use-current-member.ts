'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/use-auth';

export interface SettlementMember {
  id: string;
  settlement_id: string;
  entity_id: string;
  name: string;
  
  // Skills data (pre-calculated)
  skills: Record<string, number>;
  total_skills: number;
  highest_level: number;
  total_level: number;
  total_xp: number;
  top_profession: string;
  
  // Permissions
  inventory_permission: number;
  build_permission: number;
  officer_permission: number;
  co_owner_permission: number;
  last_login_timestamp: string | null;
  joined_settlement_at: string | null;
  is_active: boolean;
  
  // App user data (if claimed)
  auth_user_id: string | null;
  display_name: string | null;
  discord_handle: string | null;
  bio: string | null;
  timezone: string | null;
  preferred_contact: 'discord' | 'in-game' | 'app';
  theme: 'light' | 'dark' | 'system';
  profile_color: string;
  
  // App settings
  default_settlement_view: string;
  notifications_enabled: boolean;
  activity_tracking_enabled: boolean;
  
  // Timestamps
  last_synced_at: string;
  app_joined_at: string | null;
  app_last_active_at: string | null;
  created_at: string;
}

export function useCurrentMember() {
  const { data: session, status } = useSession();
  const [member, setMember] = useState<SettlementMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useCurrentMember effect:', { status, session, userId: session?.user?.id });
    
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session?.user?.id) {
      setMember(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Only fetch if we're definitely authenticated
    if (status === 'authenticated' && session?.user?.id) {
      fetchCurrentMember();
    }
  }, [session, status]);

  const fetchCurrentMember = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/current-member');
      const result = await response.json();

      if (!response.ok) {
        // Handle "No character claimed" as a normal state, not an error
        if (response.status === 404 && result.code === 'NO_CHARACTER') {
          setMember(null);
          return;
        }
        throw new Error(result.error || 'Failed to fetch member data');
      }

      setMember(result.data);
    } catch (err) {
      console.error('Failed to fetch current member:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch member data');
      setMember(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMember = async (updates: Partial<SettlementMember>) => {
    if (!member) return null;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update member');
      }

      setMember(result.data);
      return result.data;
    } catch (err) {
      console.error('Failed to update member:', err);
      throw err;
    }
  };

  const claimCharacter = async (memberId: string, displayName?: string) => {
    try {
      const response = await fetch('/api/auth/claim-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, displayName })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim character');
      }

      setMember(result.data);
      return result.data;
    } catch (err) {
      console.error('Failed to claim character:', err);
      throw err;
    }
  };

  return {
    member,
    isLoading,
    error,
    updateMember,
    claimCharacter,
    refetch: fetchCurrentMember,
    isAuthenticated: !!session,
    isClaimed: !!member?.auth_user_id,
    displayName: member?.display_name || member?.name || 'User'
  };
} 