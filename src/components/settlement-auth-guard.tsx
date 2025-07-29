'use client';

import React from 'react';
import { SettlementOnboarding } from './settlement-onboarding';
import { useSession } from 'next-auth/react';

interface SettlementAuthGuardProps {
  children: React.ReactNode;
}

export function SettlementAuthGuard({ children }: SettlementAuthGuardProps) {
  // TEMPORARY FIX: Bypass auth guard to isolate the issue
  // TODO: Re-enable after fixing NEXTAUTH_URL configuration
  console.log('⚠️ Settlement auth guard temporarily bypassed for debugging');
  return <>{children}</>;

  /* 
  // Original auth logic - commented out for debugging
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
  */
}