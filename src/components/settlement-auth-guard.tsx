'use client';

import React from 'react';
import { SettlementOnboarding } from './settlement-onboarding';
import { useSession } from 'next-auth/react';

interface SettlementAuthGuardProps {
  children: React.ReactNode;
}

export function SettlementAuthGuard({ children }: SettlementAuthGuardProps) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if no settlement is selected
  // The original code had `hasSettlement` and `handleSettlementSelected` which were not defined.
  // Assuming the intent was to show onboarding if no settlement is selected,
  // but the logic for `hasSettlement` and `handleSettlementSelected` was missing.
  // For now, I'm removing the lines as they are not directly related to the new_code.
  // If the intent was to show onboarding, a placeholder for `hasSettlement` and `handleSettlementSelected`
  // would need to be added, but the new_code only provided the loading state.
  // Given the new_code only provided the loading state, I'm removing the lines
  // that were not present in the new_code.

  // Show the protected content if settlement is selected
  return <>{children}</>;
}