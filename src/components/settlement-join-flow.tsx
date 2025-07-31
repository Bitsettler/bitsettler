'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  User,
  MapPin,
  Loader2
} from 'lucide-react';

interface SettlementJoinFlowProps {
  settlementData: {
    settlement: {
      id: string;
      name: string;
      tier: number;
      population: number;
      memberCount: number;
    };
    availableCharacters: CharacterOption[];
    totalAvailable: number;
  };
  onBack: () => void;
  onComplete: () => void;
}



interface CharacterOption {
  id: string;
  name: string;
  settlement_id: string;
  entity_id: string;
  bitjita_user_id: string;
  skills: Record<string, number>;
  top_profession: string;
  total_level: number;
}

export function SettlementJoinFlow({ settlementData, onBack, onComplete }: SettlementJoinFlowProps) {
  const [step, setStep] = useState<'character-select' | 'claiming' | 'complete' | 'error'>('character-select');
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterOption | null>(null);

  // Data is already loaded from API call

  const handleClaimCharacter = async () => {
    if (!selectedCharacter) return;

    setStep('claiming');
    try {
      const result = await api.post('/api/settlement/claim-character', {
        characterId: selectedCharacter.id,
        settlementId: settlementData.settlement.id
      });

      if (result.success) {
        setStep('complete');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setError(result.error || 'Failed to claim character');
        setStep('error');
      }
    } catch (err) {
      console.error('Failed to claim character:', err);
      setError('Failed to claim character. Please try again.');
      setStep('error');
    }
  };



  if (step === 'error') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <CardTitle>Unable to Join Settlement</CardTitle>
            <CardDescription>There was a problem with your invite code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'character-select') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <CardTitle>Settlement Found!</CardTitle>
                <CardDescription>Select your character to complete the process</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Settlement Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{settlementData.settlement.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{settlementData.settlement.memberCount} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Population: {settlementData.settlement.population}</span>
                </div>
              </div>
            </div>

            {/* Character Selection */}
            <div>
              <Label className="text-base font-semibold">Choose Your Character</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select the character you want to link to your account
              </p>
              
              <div className="grid gap-3">
                {settlementData.availableCharacters.map((character) => (
                  <Card 
                    key={character.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedCharacter?.id === character.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedCharacter(character)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{character.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {character.top_profession} • Level {character.total_level}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{Object.keys(character.skills).length} skills</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleClaimCharacter} 
                disabled={!selectedCharacter}
                className="flex-1"
              >
                Claim Character & Join Settlement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'claiming') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Claiming Character</CardTitle>
            <CardDescription>
              Setting up your access to {settlementData.settlement.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>Linking character: <strong>{selectedCharacter?.name}</strong></p>
              <p>Updating settlement access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <CardTitle>Welcome to {settlementData.settlement.name}!</CardTitle>
            <CardDescription>
              You've successfully joined the settlement as {selectedCharacter?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to your settlement dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}