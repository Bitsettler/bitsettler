'use client';

import { SettlementProjectsView } from '../../../../views/settlement-views/settlement-projects-view';
import { SettlementAuthGuard } from '../../../../components/settlement-auth-guard';

export default function SettlementProjectsPage() {
  return (
    <SettlementAuthGuard>
      <SettlementProjectsView />
    </SettlementAuthGuard>
  );
} 