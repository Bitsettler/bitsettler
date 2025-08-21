'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useClaimPlayer, type Player } from '@/hooks/use-claim-player';

interface ClaimPlayerContextType {
  member: Player | null;
  isSolo: boolean;
  isLoading: boolean;
  error: string | null;
  updateMember: (updates: Partial<Player>) => Promise<Player | null>;
  refetch: () => Promise<void>;
  isAuthenticated: boolean;
  isClaimed: boolean;
  displayName: string;
}

export const ClaimPlayerContext = createContext<ClaimPlayerContextType | undefined>(undefined);

interface ClaimPlayerProviderProps {
  children: ReactNode;
}

export function ClaimPlayerProvider({ children }: ClaimPlayerProviderProps) {
  const memberData = useClaimPlayer();

  return (
    <ClaimPlayerContext.Provider value={memberData}>
      {children}
    </ClaimPlayerContext.Provider>
  );
}

export function useClaimPlayerContext() {
  const context = useContext(ClaimPlayerContext);
  if (context === undefined) {
    throw new Error('useClaimPlayerContext must be used within a ClaimPlayerProvider');
  }
  return context;
}
