'use client';

import { useSession } from '@/hooks/use-auth';
import { SettlementTreasuryView } from '../../../../views/settlement-views/settlement-treasury-view';
import { Container } from '../../../../components/container';

export default function SettlementTreasuryPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">You must be logged in to view this page.</p>
          <a 
            href="/en/auth/signin" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In
          </a>
        </div>
      </Container>
    );
  }

  return <SettlementTreasuryView />;
} 