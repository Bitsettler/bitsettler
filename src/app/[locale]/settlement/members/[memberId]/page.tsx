import { SettlementMemberDetailView } from '../../../../../views/settlement-views/settlement-member-detail-view';

interface MemberDetailPageProps {
  params: Promise<{
    memberId: string;
    locale: string;
  }>;
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { memberId } = await params;
  return <SettlementMemberDetailView memberId={memberId} />;
} 