import { SettlementTreasuryView } from '../../../../views/settlement-views/settlement-treasury-view';
import { SettlementAuthGuard } from '../../../../components/settlement-auth-guard';

// Settlement Treasury Dashboard Page
// Data > Page > View architecture:
// - Data Layer: getTreasurySummary, getTreasuryTransactions commands (already built)
// - Page Layer: This file (routing and data orchestration)  
// - View Layer: SettlementTreasuryView component

export default function SettlementTreasuryPage() {
  return (
    <SettlementAuthGuard>
      <SettlementTreasuryView />
    </SettlementAuthGuard>
  );
} 