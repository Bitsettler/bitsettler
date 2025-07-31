'use client';

import { SettlementSkillsView } from '../../../../views/settlement-views/settlement-skills-view';
import { SettlementAuthGuard } from '../../../../components/settlement-auth-guard';

export default function SettlementSkillsPage() {
  return (
    <SettlementAuthGuard>
      <SettlementSkillsView />
    </SettlementAuthGuard>
  );
} 