'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/use-auth';

export interface SettlementMember {
  id: string;
  player_entity_id: string;
  name: string;
  settlement_id: string | null;
  
  // Skills data (pre-calculated)
  skills: Record<string, number>;
  total_skills: number;
  highest_level: number;
  total_level: number;
  total_xp: number;
  top_profession: string | null;
  primary_profession: string | null;
  secondary_profession: string | null;
  
  // Status and activity
  last_login_timestamp: string | null;
  joined_settlement_at: string | null;
  is_active: boolean;
  is_solo: boolean;
  
  // App user data (if claimed)
  supabase_user_id: string | null;
  display_name: string | null;
  discord_handle: string | null;
  bio: string | null;
  timezone: string | null;
  avatar_url: string | null;
  preferred_contact: 'discord' | 'in-game' | 'app';
  theme: 'light' | 'dark' | 'system';
  profile_color: string;
  
  // App settings
  default_settlement_view: string;
  notifications_enabled: boolean;
  activity_tracking_enabled: boolean;
  onboarding_completed_at: string | null;
  
  // Sync and timestamps
  last_synced_at: string;
  sync_source: string;
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

        console.log("member => ", member)

      if (error) {
        console.error('Failed to fetch current member:', error);
        setError('Failed to fetch member data');
        setMember(null);
        return
      }

      if (member) {
        const { data: settlementMemberShip, error: settlementMemberShipError } = await supabase
          .from('settlement_members_memberships')
          .select('*')
          .eq('player_entity_id', member.player_entity_id)
          .eq('is_claim', true)
          .maybeSingle();
      
        if (settlementMemberShipError) {
          console.error('Failed to fetch settlement member ship:', settlementMemberShipError);
          setError('Failed to fetch settlement member ship data');
          setMember(null);
        }
        setMember({ ...member, settlement_id: settlementMemberShip?.settlement_id });
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

  const claimCharacter = async (memberId: string, displayName?: string) => {
    if (!session?.user?.id) throw new Error('Must be authenticated to claim character');

    try {
      // Claim character directly with Supabase - RLS will protect the data
      const { supabase } = await import('@/lib/supabase-auth');
      
      const now = new Date().toISOString();
      const { data: claimedMember, error } = await supabase
        .from('settlement_members')
        .update({
          supabase_user_id: session.user.id,
          display_name: displayName || null,
          app_joined_at: now,
          app_last_active_at: now,
          preferred_contact: 'discord',
          theme: 'system',
          profile_color: '#3b82f6',
          default_settlement_view: 'dashboard',
          notifications_enabled: true,
          activity_tracking_enabled: true,
          sync_source: 'bitjita'
        })
        .eq('player_entity_id', memberId) // Use player_entity_id for stable character identification
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