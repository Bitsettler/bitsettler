'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  User,
  Loader2
} from 'lucide-react';

// Import the unified character selection UI
import { SettlementJoinFlow } from './settlement-join-flow';

interface SettlementSwitchFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

interface SwitchCharacterData {
  settlement: {
    id: string;
    name: string;
    memberCount: number;
  };
  availableCharacters: any[];
  totalAvailable: number;
  currentCharacter: {
    id: string;
    name: string;
  };
}

export function SettlementSwitchFlow({ onBack, onComplete }: SettlementSwitchFlowProps) {
  const [step, setStep] = useState<'loading' | 'character-select' | 'error'>('loading');
  const [switchData, setSwitchData] = useState<SwitchCharacterData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load available characters for switching
  useEffect(() => {
    const loadSwitchData = async () => {
      try {
        setStep('loading');
        setError(null);
        
        const result = await api.get('/api/settlement/switch-character');
        
        if (result.success) {
          console.log('✅ Switch character data loaded:', result.data);
          setSwitchData(result.data);
          setStep('character-select');
        } else {
          console.error('❌ Failed to load switch data:', result.error);
          setError(result.error || 'Failed to load available characters');
          setStep('error');
        }
      } catch (err) {
        console.error('❌ Network error during switch character loading:', err);
        setError('Network error. Please try again.');
        setStep('error');
      }
    };

    loadSwitchData();
  }, []);

  // Handle the character switching completion
  const handleSwitchComplete = () => {
    console.log('✅ Character switch completed');
    onComplete();
  };

  // Loading state
  if (step === 'loading') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
            <CardTitle>Loading Available Characters</CardTitle>
            <CardDescription>
              Checking for characters available for switching in your settlement
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Unable to Switch Characters</CardTitle>
            <CardDescription>
              There was an issue loading available characters for switching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex items-center gap-2 justify-center">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={() => setStep('loading')}>
                <RefreshCw className="w-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Character selection state - reuse the unified UI!
  if (step === 'character-select' && switchData) {
    // Create a modified version of the switch data that includes replacement flag
    const modifiedSwitchData = {
      ...switchData,
      // Add context about this being a switch operation
      settlement: {
        ...switchData.settlement,
        name: `${switchData.settlement.name} (Character Switch)`
      }
    };

    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Switch Context Header */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Character Switching</h3>
                <p className="text-sm text-muted-foreground">
                  Current character: <strong>{switchData.currentCharacter.name}</strong> → 
                  Select a new character to switch to
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reuse the unified character selection UI */}
        <SettlementJoinFlow
          settlementData={modifiedSwitchData}
          onBack={onBack}
          onComplete={handleSwitchComplete}
          // Pass a flag to indicate this is a switch operation
          isCharacterSwitch={true}
        />
      </div>
    );
  }

  return null;
}