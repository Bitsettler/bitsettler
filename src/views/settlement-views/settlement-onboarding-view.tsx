'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/container';
import { SettlementOnboardingChoice } from '@/components/settlement-onboarding-choice';
import { SettlementJoinFlow } from '@/components/settlement-join-flow';
import { SettlementEstablishFlow } from '@/components/settlement-establish-flow';

export function SettlementOnboardingView() {
  const [currentFlow, setCurrentFlow] = useState<'choice' | 'join' | 'establish'>('choice');
  const [inviteCode, setInviteCode] = useState<string>('');
  const router = useRouter();

  const handleJoinSettlement = (code: string) => {
    setInviteCode(code);
    setCurrentFlow('join');
  };

  const handleEstablishSettlement = () => {
    setCurrentFlow('establish');
  };

  const handleBack = () => {
    setCurrentFlow('choice');
    setInviteCode('');
  };

  const handleComplete = () => {
    // Refresh the page to re-check authentication and member status
    // This will cause the settlement page to reload and show the dashboard
    router.refresh();
  };

  return (
    <Container>
      {currentFlow === 'choice' && (
        <SettlementOnboardingChoice
          onJoinSettlement={handleJoinSettlement}
          onEstablishSettlement={handleEstablishSettlement}
        />
      )}

      {currentFlow === 'join' && (
        <SettlementJoinFlow
          inviteCode={inviteCode}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      )}

      {currentFlow === 'establish' && (
        <SettlementEstablishFlow
          onBack={handleBack}
          onComplete={handleComplete}
        />
      )}
    </Container>
  );
}