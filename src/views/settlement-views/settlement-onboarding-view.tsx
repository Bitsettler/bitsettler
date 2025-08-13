'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/container';
import { SettlementOnboardingChoice } from '@/components/settlement-onboarding-choice';
import { SettlementEstablishFlow } from '@/components/settlement-establish-flow';
import type { SettlementEstablishData } from '@/lib/types/component-props';

export function SettlementOnboardingView() {
  const [currentFlow, setCurrentFlow] = useState<'choice' | 'establish'>('choice');
  const [establishData, setEstablishData] = useState<SettlementEstablishData | null>(null);
  const router = useRouter();

  const handleEstablishSettlement = (data: SettlementEstablishData) => {
    setEstablishData(data);
    setCurrentFlow('establish');
  };

  const handleBack = () => {
    setCurrentFlow('choice');
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
          onEstablishSettlement={handleEstablishSettlement}
        />
      )}

      {currentFlow === 'establish' && establishData && (
        <SettlementEstablishFlow
          settlementData={establishData}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      )}
    </Container>
  );
}