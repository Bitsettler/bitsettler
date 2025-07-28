'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  // Core Identity
  displayName: string;
  discordHandle?: string;
  inGameName?: string;
  bio?: string;
  
  // Timestamps
  joinedAt: string;
  lastActiveAt: string;
  
  // Contact & Social
  timezone?: string;
  preferredContact?: 'discord' | 'in-game' | 'app';
  
  // Preferences
  theme?: 'light' | 'dark' | 'system';
  defaultSettlementView?: 'dashboard' | 'members' | 'projects' | 'treasury' | 'skills';
  notifications: {
    syncUpdates: boolean;
    settlementActivity: boolean;
    memberJoins: boolean;
    projectUpdates: boolean;
  };
  
  // Customization
  profileColor: string;
  profileInitials: string;
  profession?: string; // profession ID
  
  // Activity & Favorites
  favoriteSettlements: string[];
  recentActivity: ActivityEntry[];
  stats: {
    settlementsConnected: number;
    calculationsRun: number;
    totalAppTime: number; // in minutes
  };
}

export interface ActivityEntry {
  id: string;
  type: 'settlement_connected' | 'member_viewed' | 'calculation_run' | 'project_viewed' | 'skills_analyzed';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface UserProfileHook {
  profile: UserProfile | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addActivity: (activity: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
  addFavoriteSettlement: (settlementId: string) => void;
  removeFavoriteSettlement: (settlementId: string) => void;
  clearProfile: () => void;
  hasProfile: boolean;
  isFirstTime: boolean;
}

const STORAGE_KEY = 'userProfile';
const ACTIVITY_LIMIT = 50; // Keep last 50 activities

// Default profile colors for new users
const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
];

function generateProfileColor(): string {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function createDefaultProfile(displayName: string): UserProfile {
  const now = new Date().toISOString();
  const profileColor = generateProfileColor();
  
  return {
    displayName,
    joinedAt: now,
    lastActiveAt: now,
    notifications: {
      syncUpdates: true,
      settlementActivity: true,
      memberJoins: false,
      projectUpdates: true,
    },
    profileColor,
    profileInitials: generateInitials(displayName),
    favoriteSettlements: [],
    recentActivity: [],
    stats: {
      settlementsConnected: 0,
      calculationsRun: 0,
      totalAppTime: 0,
    },
  };
}

export function useUserProfile(): UserProfileHook {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(STORAGE_KEY);
      
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile) as UserProfile;
        
        // Update last active timestamp
        parsedProfile.lastActiveAt = new Date().toISOString();
        
        setProfile(parsedProfile);
        
        // Save updated last active time
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedProfile));
      } else {
        setIsFirstTime(true);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
      setIsFirstTime(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(currentProfile => {
      if (!currentProfile) {
        // If no profile exists, create a new one
        const displayName = updates.displayName?.trim() || 'BitCraft User';
        const newProfile = createDefaultProfile(displayName);
        const updatedProfile = { ...newProfile, ...updates };
        
        // Update computed fields
        if (updates.displayName?.trim()) {
          updatedProfile.profileInitials = generateInitials(updates.displayName.trim());
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
        return updatedProfile;
      }

      const updatedProfile = {
        ...currentProfile,
        ...updates,
        lastActiveAt: new Date().toISOString(),
      };

      // Update computed fields
      if (updates.displayName?.trim()) {
        updatedProfile.profileInitials = generateInitials(updates.displayName.trim());
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    });
    
    // Update isFirstTime flag if we just created a profile
    if (!profile && updates.displayName?.trim()) {
      setIsFirstTime(false);
    }
  }, [profile]);

  // Add activity entry
  const addActivity = useCallback((activity: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    setProfile(currentProfile => {
      if (!currentProfile) return null;

      const newActivity: ActivityEntry = {
        ...activity,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };

      const updatedActivities = [newActivity, ...currentProfile.recentActivity]
        .slice(0, ACTIVITY_LIMIT);

      const updatedProfile = {
        ...currentProfile,
        recentActivity: updatedActivities,
        lastActiveAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    });
  }, []);

  // Add favorite settlement
  const addFavoriteSettlement = useCallback((settlementId: string) => {
    setProfile(currentProfile => {
      if (!currentProfile) return null;

      const updatedFavorites = Array.from(new Set([...currentProfile.favoriteSettlements, settlementId]));
      
      const updatedProfile = {
        ...currentProfile,
        favoriteSettlements: updatedFavorites,
        lastActiveAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    });
  }, []);

  // Remove favorite settlement
  const removeFavoriteSettlement = useCallback((settlementId: string) => {
    setProfile(currentProfile => {
      if (!currentProfile) return null;

      const updatedFavorites = currentProfile.favoriteSettlements.filter(id => id !== settlementId);
      
      const updatedProfile = {
        ...currentProfile,
        favoriteSettlements: updatedFavorites,
        lastActiveAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    });
  }, []);

  // Clear profile
  const clearProfile = useCallback(() => {
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
    setIsFirstTime(true);
  }, []);

  return {
    profile,
    isLoading,
    updateProfile,
    addActivity,
    addFavoriteSettlement,
    removeFavoriteSettlement,
    clearProfile,
    hasProfile: !!profile,
    isFirstTime,
  };
} 