'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/use-auth';

export interface SettlementMember {
  id: string;
  player_entity_id: string;
  name: string;
  settlement_id: string | null; 
  skills: Record<string, number>;
  total_skills: number;
  highest_level: number;
  total_level: number;
  total_xp: number;
  top_profession: string | null;
  primary_profession: string | null;
  secondary_profession: string | null;
  last_login_timestamp: string | null;
  joined_settlement_at: string | null;
  is_active: boolean;
  is_solo: boolean;
  supabase_user_id: string | null;
  display_name: string | null;
  discord_handle: string | null;
  bio: string | null;
  timezone: string | null;
  avatar_url: string | null;
  preferred_contact: 'discord' | 'in-game' | 'app';
  theme: 'light' | 'dark' | 'system';
  profile_color: string; 
  default_settlement_view: string;
  notifications_enabled: boolean;
  activity_tracking_enabled: boolean;
  onboarding_completed_at: string | null;
  last_synced_at: string;
  sync_source: string;
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

  return {
    member,
    isLoading,
    error,
    updateMember,
    refetch: fetchCurrentMember,
    isAuthenticated: !!session,
    isClaimed: !!member?.supabase_user_id,
    displayName: member?.display_name || member?.name || 'User'
  };
} 