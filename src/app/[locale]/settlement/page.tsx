'use client';

import { SettlementDashboardView } from '../../../views/settlement-views/settlement-dashboard-view';
import { SettlementOnboarding } from '../../../components/settlement-onboarding';
import { useSelectedSettlement, Settlement } from '../../../hooks/use-selected-settlement';

// This page follows the Data > Page > View architecture:
// - Data Layer: Already built in src/lib/spacetime-db-new/modules
// - Page Layer: This file (handles routing and data orchestration)
// - View Layer: SettlementDashboardView component

export default function SettlementDashboardPage() {
  const { selectedSettlement, isLoading, selectSettlement, hasSettlement } = useSelectedSettlement();

  const handleSettlementSelected = (settlement: Settlement) => {
    selectSettlement(settlement);
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

  // Show the dashboard if settlement is selected
  return <SettlementDashboardView />;
} 