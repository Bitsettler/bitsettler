'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/container';
import { SettlementOnboardingChoice } from '@/components/settlement-onboarding-choice';
import { SettlementJoinFlow } from '@/components/settlement-join-flow';
import { SettlementEstablishFlow } from '@/components/settlement-establish-flow';
import type { SettlementJoinData, SettlementEstablishData } from '@/lib/types/component-props';

export function SettlementOnboardingView() {
  const [currentFlow, setCurrentFlow] = useState<'choice' | 'join' | 'establish'>('choice');
  const [joinData, setJoinData] = useState<SettlementJoinData | null>(null);
  const [establishData, setEstablishData] = useState<SettlementEstablishData | null>(null);
  const router = useRouter();

  const handleJoinSettlement = (data: SettlementJoinData) => {
    setJoinData(data);
    setCurrentFlow('join');
  };

  const handleEstablishSettlement = (data: SettlementEstablishData) => {
    setEstablishData(data);
    setCurrentFlow('establish');
  };

  const handleBack = () => {
    setCurrentFlow('choice');
    setJoinData(null);
    setEstablishData(null);
  };

  const handleComplete = async () => {
    console.log('Settlement onboarding completed, redirecting to dashboard...');
    
    // Add a small delay to ensure database transaction is committed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to settlement dashboard to trigger proper re-evaluation
    window.location.href = '/en/settlement';
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