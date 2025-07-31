'use client';

import { SettlementTreasuryView } from '../../../../views/settlement-views/settlement-treasury-view';
import { SettlementAuthGuard } from '../../../../components/settlement-auth-guard';

export default function SettlementTreasuryPage() {
  return (
    <SettlementAuthGuard>
      <SettlementTreasuryView />
    </SettlementAuthGuard>
  );
} 