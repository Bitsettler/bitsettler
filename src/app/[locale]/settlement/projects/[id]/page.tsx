import { SettlementProjectDetailView } from '../../../../../views/settlement-views/settlement-project-detail-view';

// Individual Project Detail Page
// Data > Page > View architecture:
// - Data Layer: getProjectById command (already built)
// - Page Layer: This file (routing and data orchestration)  
// - View Layer: SettlementProjectDetailView component

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <SettlementProjectDetailView projectId={params.id} />;
} 