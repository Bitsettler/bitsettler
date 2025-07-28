import { Metadata } from 'next';

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
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
} 