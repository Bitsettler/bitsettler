'use client';

import { SettlementDashboardView } from '../../../views/settlement-views/settlement-dashboard-view';
import { SettlementAuthGuard } from '../../../components/settlement-auth-guard';

export default function SettlementDashboardPage() {
  return (
    <SettlementAuthGuard>
      <SettlementDashboardView />
    </SettlementAuthGuard>
  );
} 