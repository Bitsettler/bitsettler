'use client';

import { SettlementOnboarding } from './settlement-onboarding';
import { useSelectedSettlement, Settlement } from '../hooks/use-selected-settlement';

interface SettlementAuthGuardProps {
  children: React.ReactNode;
}

export function SettlementAuthGuard({ children }: SettlementAuthGuardProps) {
  const { selectedSettlement, isLoading, selectSettlement, hasSettlement } = useSelectedSettlement();

  const handleSettlementSelected = async (settlement: Settlement) => {
    // Skip the automatic sync since onboarding flow already performed it
    await selectSettlement(settlement, true);
  };

  // Show loading state briefly while checking localStorage
  if (isLoading) {
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
  if (!hasSettlement) {
    return <SettlementOnboarding onSettlementSelected={handleSettlementSelected} />;
  }

  // Show the protected content if settlement is selected
  return <>{children}</>;
}