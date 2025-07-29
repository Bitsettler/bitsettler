import { SettlementResearchView } from '../../../../views/settlement-views/settlement-research-view';
import { SettlementAuthGuard } from '../../../../components/settlement-auth-guard';

export default function SettlementResearchPage() {
  return (
    <SettlementAuthGuard>
      <SettlementResearchView />
    </SettlementAuthGuard>
  );
}