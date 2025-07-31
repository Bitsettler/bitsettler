'use client';

import { SettlementManageView } from '../../../../views/settlement-views/settlement-manage-view';
import { SettlementAuthGuard } from '../../../../components/settlement-auth-guard';

export default function SettlementManagePage() {
  return (
    <SettlementAuthGuard>
      <SettlementManageView />
    </SettlementAuthGuard>
  );
} 