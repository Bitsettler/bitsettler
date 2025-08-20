'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/use-auth';

export interface Player {
  id: string;
  name: string;
  is_claim: boolean;
  is_active: boolean;
  is_solo: boolean;

  claim_settlement_id: string | null;
  supabase_user_id: string | null;

  settlements: any[] | null;
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

export function useClaimPlayer() {
  const { data: session, status } = useSession();
  const [member, setMember] = useState<Player | null>(null);
  const [isSolo, setIsSolo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaimPlayer = useCallback(async () => {
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
        .from('players')
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
        setIsSolo(member.is_solo);
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
      fetchClaimPlayer();
    }
  }, [fetchClaimPlayer, session?.user?.id, status]); // Include the memoized function

  const updateMember = async (updates: Partial<Player>) => {
    if (!member || !session?.user?.id) return null;

    try {
      // Update Supabase directly - RLS will protect the data
      const { supabase } = await import('@/lib/supabase-auth');
      
      const { data: updatedMember, error } = await supabase
        .from('players')
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
    isSolo,
    isLoading,
    error,
    updateMember,
    refetch: fetchClaimPlayer,
    isAuthenticated: !!session,
    isClaimed: !!member?.supabase_user_id,
    displayName: member?.display_name || member?.name || 'User'
  };
} 