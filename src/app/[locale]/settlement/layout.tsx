import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settlement Management - BitCraft.Guide',
  description: 'Manage your BitCraft settlement, track members, projects, and treasury.',
};

export default function SettlementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Settlement Management</h1>
          <p className="text-muted-foreground mt-2">
            Track members, manage projects, and monitor treasury for your BitCraft settlement.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
} 