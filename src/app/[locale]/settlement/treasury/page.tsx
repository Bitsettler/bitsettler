import { SettlementTreasuryView } from '../../../../views/settlement-views/settlement-treasury-view';

// Settlement Treasury Dashboard Page
// Data > Page > View architecture:
// - Data Layer: getTreasurySummary, getTreasuryTransactions commands (already built)
// - Page Layer: This file (routing and data orchestration)  
// - View Layer: SettlementTreasuryView component

export default async function SettlementTreasuryPage() {
  return <SettlementTreasuryView />;
} 