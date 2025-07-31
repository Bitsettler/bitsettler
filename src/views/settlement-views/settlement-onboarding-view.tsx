'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/container';
import { SettlementOnboardingChoice } from '@/components/settlement-onboarding-choice';
import { SettlementJoinFlow } from '@/components/settlement-join-flow';
import { SettlementEstablishFlow } from '@/components/settlement-establish-flow';

export function SettlementOnboardingView() {
  const [currentFlow, setCurrentFlow] = useState<'choice' | 'join' | 'establish'>('choice');
  const [joinData, setJoinData] = useState<any>(null);
  const [establishData, setEstablishData] = useState<any>(null);
  const router = useRouter();

  const handleJoinSettlement = (data: any) => {
    setJoinData(data);
    setCurrentFlow('join');
  };

  const handleEstablishSettlement = (data: any) => {
    setEstablishData(data);
    setCurrentFlow('establish');
  };

  const handleBack = () => {
    setCurrentFlow('choice');
    setJoinData(null);
    setEstablishData(null);
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

      {currentFlow === 'join' && joinData && (
        <SettlementJoinFlow
          settlementData={joinData}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      )}

      {currentFlow === 'establish' && (
        <SettlementEstablishFlow
          establishData={establishData}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      )}
    </Container>
  );
}