'use client';

import { SettlementDashboardView } from '../../../views/settlement-views/settlement-dashboard-view';
import { SettlementAuthGuard } from '../../../components/settlement-auth-guard';

// This page follows the Data > Page > View architecture:
// - Data Layer: Already built in src/lib/spacetime-db-new/modules
// - Page Layer: This file (handles routing and data orchestration)
// - View Layer: SettlementDashboardView component

export default function SettlementDashboardPage() {
  return (
    <SettlementAuthGuard>
      <SettlementDashboardView />
    </SettlementAuthGuard>
  );
} 