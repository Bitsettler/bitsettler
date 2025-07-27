import { SettlementDashboardView } from '../../../views/settlement-views/settlement-dashboard-view';

// This page follows the Data > Page > View architecture:
// - Data Layer: Already built in src/lib/spacetime-db-new/modules
// - Page Layer: This file (handles routing and data orchestration)
// - View Layer: SettlementDashboardView component

export default async function SettlementDashboardPage() {
  // In the Data > Page > View pattern, the page layer calls data layer commands/flows
  // directly. We could call getSettlementDashboard() and getTreasuryDashboard() here,
  // but since we're using client-side fetching for real-time updates, we'll let the 
  // view component handle the API calls.

  return <SettlementDashboardView />;
} 