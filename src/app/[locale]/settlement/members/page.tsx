import { SettlementMembersView } from '../../../../views/settlement-views/settlement-members-view';

// Settlement Members Directory Page
// Data > Page > View architecture:
// - Data Layer: getAllMembers command (already built)
// - Page Layer: This file (routing and data orchestration)  
// - View Layer: SettlementMembersView component

export default async function SettlementMembersPage() {
  return <SettlementMembersView />;
} 