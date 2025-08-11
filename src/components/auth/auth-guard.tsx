'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-auth';
import { useCurrentMember } from '@/hooks/use-current-member';
import { Container } from '@/components/container';
import { SettlementOnboardingView } from '@/views/settlement-views/settlement-onboarding-view';
import { FormerMemberView } from '@/components/settlement/former-member-view';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const { member, isLoading: memberLoading, isClaimed } = useCurrentMember();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/en/auth/signin');
    }
  }, [status, router]);

  // Loading states
  if (status === 'loading' || (status === 'authenticated' && memberLoading)) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">
              {status === 'loading' ? 'Checking authentication...' : 'Loading settlement data...'}
            </p>
          </div>
        </div>
      </Container>
    );
  }

  // Not authenticated - will redirect but show loading in the meantime
  if (!session) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      </Container>
    );
  }

  // Authenticated but no settlement character claimed - show onboarding
  if (!isClaimed || !member) {
    console.log('AuthGuard: Showing onboarding - isClaimed:', isClaimed, 'member:', !!member, 'memberLoading:', memberLoading);
    return <SettlementOnboardingView />;
  }

  // Authenticated with settlement character but no longer active - show former member view
  if (member && !member.is_active) {
    return <FormerMemberView member={member} />;
  }

  // Authenticated and has active settlement member - show protected content
  return <>{children}</>;
}