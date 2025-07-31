'use client';

import { SettlementMembersView } from '../../../../views/settlement-views/settlement-members-view';
import { SettlementAuthGuard } from '../../../../components/settlement-auth-guard';

export default function SettlementMembersPage() {
  return (
    <SettlementAuthGuard>
      <SettlementMembersView />
    </SettlementAuthGuard>
  );
} 