'use client';

import { useState, useEffect, useCallback } from 'react';
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
  supabase_user_id: string | null;
  bitjita_user_id: string | null;
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

  const fetchCurrentMember = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session?.user?.id) {
        setMember(null);
        setIsLoading(false);
        return;
      }

      // Query Supabase directly - RLS will protect the data
      const { supabase } = await import('@/lib/supabase-auth');
      
      const { data: member, error } = await supabase
        .from('settlement_members')
        .select('*')
        .eq('supabase_user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch current member:', error);
        setError('Failed to fetch member data');
        setMember(null);
      } else {
        setMember(member);
      }
    } catch (err) {
      console.error('Failed to fetch current member:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch member data');
      setMember(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]); // Only recreate when user ID changes

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session?.user?.id) {
      setMember(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetchCurrentMember();
    }
  }, [fetchCurrentMember, session?.user?.id, status]); // Include the memoized function

  const updateMember = async (updates: Partial<SettlementMember>) => {
    if (!member || !session?.user?.id) return null;

    try {
      // Update Supabase directly - RLS will protect the data
      const { supabase } = await import('@/lib/supabase-auth');
      
      const { data: updatedMember, error } = await supabase
        .from('settlement_members')
        .update(updates)
        .eq('supabase_user_id', session.user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update member');
      }

      setMember(updatedMember);
      return updatedMember;
    } catch (err) {
      console.error('Failed to update member:', err);
      throw err;
    }
  };

  const claimCharacter = async (memberId: string, bitjitaUserId: string, displayName?: string) => {
    if (!session?.user?.id) throw new Error('Must be authenticated to claim character');

    try {
      // Claim character directly with Supabase - RLS will protect the data
      const { supabase } = await import('@/lib/supabase-auth');
      
      const { data: claimedMember, error } = await supabase
        .from('settlement_members')
        .update({
          supabase_user_id: session.user.id,
          bitjita_user_id: bitjitaUserId,
          display_name: displayName || null,
          app_joined_at: new Date().toISOString(),
          app_last_active_at: new Date().toISOString()
        })
        .eq('entity_id', memberId) // Fix: Use entity_id for character identification
        .eq('supabase_user_id', null) // Only unclaimed characters
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Character not found or already claimed');
        }
        throw new Error(error.message || 'Failed to claim character');
      }

      setMember(claimedMember);
      return claimedMember;
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
    isClaimed: !!member?.supabase_user_id,
    displayName: member?.display_name || member?.name || 'User'
  };
} 