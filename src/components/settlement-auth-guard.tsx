'use client';

import React from 'react';
import { SettlementOnboarding } from './settlement-onboarding';
import { useSession } from 'next-auth/react';

interface SettlementAuthGuardProps {
  children: React.ReactNode;
}

export function SettlementAuthGuard({ children }: SettlementAuthGuardProps) {
  const { status } = useSession();
  const [showContent, setShowContent] = React.useState(false);

  // Auto-proceed after reasonable timeout to prevent infinite loading
  React.useEffect(() => {
    if (status === 'loading') {
      const timeout = setTimeout(() => {
        console.warn('⚠️ NextAuth session loading timeout - proceeding to content anyway');
        setShowContent(true);
      }, 3000); // 3 second timeout

      return () => clearTimeout(timeout);
    }
  }, [status]);

  // Show content if session is ready or timeout reached
  if (status !== 'loading' || showContent) {
    return <>{children}</>;
  }

  // Show loading state
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading...</p>
      </div>
    </div>
  );
}