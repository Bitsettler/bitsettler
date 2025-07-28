import { Metadata } from 'next';
import { GlobalSyncStatus } from '../../../components/global-sync-status';
import { SettlementHeader } from '../../../components/settlement-header';

export const metadata: Metadata = {
  title: 'Settlement - BitCraft.Guide',
  description: 'Manage your BitCraft settlement, track members, projects, and treasury.',
};

export default function SettlementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SettlementHeader />
      <div className="py-6">
        {children}
      </div>
      
      {/* Global sync status indicator - always visible in settlement areas */}
      <GlobalSyncStatus 
        position="top-right"
        autoHide={true}
        autoHideDelay={4000}
      />
    </div>
  );
} 