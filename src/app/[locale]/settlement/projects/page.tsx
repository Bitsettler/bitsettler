import { SettlementProjectsView } from '../../../../views/settlement-views/settlement-projects-view';

// Settlement Projects Page
// Data > Page > View architecture:
// - Data Layer: getAllProjects, getAllProjectsWithItems commands (already built)
// - Page Layer: This file (routing and data orchestration)  
// - View Layer: SettlementProjectsView component

export default async function SettlementProjectsPage() {
  return <SettlementProjectsView />;
} 