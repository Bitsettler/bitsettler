import { SettlementMembersView } from '../../../../views/settlement-views/settlement-members-view';
import { SettlementAuthGuard } from '../../../../components/settlement-auth-guard';

// Settlement Members Directory Page
// Data > Page > View architecture:
// - Data Layer: getAllMembers command (already built)
// - Page Layer: This file (routing and data orchestration)  
// - View Layer: SettlementMembersView component

export default function SettlementMembersPage() {
  return (
    <SettlementAuthGuard>
      <SettlementMembersView />
    </SettlementAuthGuard>
  );
} 