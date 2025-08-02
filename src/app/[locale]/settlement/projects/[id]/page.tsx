import { SettlementProjectDetailView } from '../../../../../views/settlement-views/settlement-project-detail-view';

// Individual Project Detail Page
// Data > Page > View architecture:
// - Data Layer: getProjectById/getProjectBySlug commands (already built)
// - Page Layer: This file (routing and data orchestration)  
// - View Layer: SettlementProjectDetailView component
// Supports both slug-based URLs (/projects/town-hall-construction) and ID-based URLs (/projects/proj_123) for backwards compatibility

export default function ProjectDetailPage() {
  return <SettlementProjectDetailView />;
} 