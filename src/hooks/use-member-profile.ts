'use client';

import { useCurrentMember } from './use-current-member';

export interface ProfileUpdateData {
  display_name?: string;
  discord_handle?: string;
  bio?: string;
  timezone?: string;
  preferred_contact?: 'discord' | 'in-game' | 'app';
  theme?: 'light' | 'dark' | 'system';
  profile_color?: string;
  default_settlement_view?: string;
  notifications_enabled?: boolean;
  activity_tracking_enabled?: boolean;
}

export function useMemberProfile() {
  const { member, updateMember, isLoading, error } = useCurrentMember();

  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!member) {
      throw new Error('Must be signed in to update profile');
    }

    try {
      const result = await updateMember(updates);
      return result;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const resetToDefaults = async () => {
    const defaults: ProfileUpdateData = {
      theme: 'system',
      profile_color: '#3b82f6',
      preferred_contact: 'discord',
      default_settlement_view: 'dashboard',
      notifications_enabled: true,
      activity_tracking_enabled: true
    };

    return updateProfile(defaults);
  };

  return {
    member,
    isLoading,
    error,
    updateProfile,
    resetToDefaults,
    
    // Convenience getters
    displayName: member?.display_name || member?.name || 'User',
    isSetup: !!(member?.display_name || member?.discord_handle),
    theme: member?.theme || 'system',
    profileColor: member?.profile_color || '#3b82f6',
    isClaimed: !!member?.supabase_user_id
  };
} 