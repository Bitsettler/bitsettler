import { Metadata } from 'next';
import { AuthGuard } from '@/components/auth/auth-guard';
import '@/styles/settlement-tiers.css';

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
      <AuthGuard>
        {children}
      </AuthGuard>
    </div>
  );
} 