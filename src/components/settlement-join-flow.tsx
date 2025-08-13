'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  User,
  Loader2,
  Crown
} from 'lucide-react';
import { getDisplayProfession } from '@/lib/utils/profession-utils';
import { clog } from '@/lib/utils/client-logger';

interface SettlementJoinFlowProps {
  settlementData: {
    settlement: {
      id: string;
      name: string;
      memberCount: number;
    };
    availableCharacters: CharacterOption[];
    currentCharacter?: {
      id: string;
      name: string;
    };
  };
  onBack: () => void;
  onComplete: () => void;
  isCharacterSwitch?: boolean;
}

interface CharacterOption {
  id: string;
  name: string;
  total_level: number;
  highest_level: number;
  skill_levels: { [skill: string]: number };
  is_member?: boolean;
  position?: {
    co_owner: boolean;
  };
}

export function SettlementJoinFlow({ 
  settlementData, 
  onBack, 
  onComplete, 
  isCharacterSwitch = false 
}: SettlementJoinFlowProps) {
  const [step, setStep] = useState<'character-select' | 'confirming' | 'complete' | 'error'>('character-select');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterOption | null>(null);
  const [characterSearchTerm, setCharacterSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter characters based on search term
  const filteredCharacters = useMemo(() => {
    if (!characterSearchTerm.trim()) {
      return settlementData.availableCharacters;
    }
    
    const searchLower = characterSearchTerm.toLowerCase();
    return settlementData.availableCharacters.filter(character => 
      character.name?.toLowerCase().includes(searchLower) ||
      getDisplayProfession(character)?.toLowerCase().includes(searchLower) ||
      (character.total_level?.toString() || '').includes(searchLower) ||
      (character.highest_level?.toString() || '').includes(searchLower)
    );
  }, [settlementData.availableCharacters, characterSearchTerm]);

  const handleCharacterSelect = async (character: CharacterOption) => {
    setSelectedCharacter(character);
    setIsProcessing(true);
    setStep('confirming');

    try {
      const action = isCharacterSwitch ? 'switch' : 'join';
      clog(`Attempting to ${action} character:`, character.name);

      // Call the appropriate API endpoint
      const endpoint = isCharacterSwitch 
        ? `/api/settlement/switch-character`
        : `/api/settlement/join-character`;

      const response = await api.post(endpoint, {
        settlementId: settlementData.settlement.id,
        characterId: character.id,
        characterName: character.name
      });

      if (response.success) {
        setStep('complete');
        // Small delay to show success state before calling onComplete
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        throw new Error(response.error || `Failed to ${action} character`);
      }
    } catch (error) {
      console.error(`Character ${isCharacterSwitch ? 'switch' : 'join'} error:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${isCharacterSwitch ? 'switch to' : 'join with'} character`);
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setStep('character-select');
    setSelectedCharacter(null);
  };

  // Character selection UI
  if (step === 'character-select') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {isCharacterSwitch ? 'Switch Character' : 'Select Character'}
                </CardTitle>
                <CardDescription>
                  {isCharacterSwitch 
                    ? `Choose a character to switch to in ${settlementData.settlement.name}`
                    : `Choose your character to join ${settlementData.settlement.name}`}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Bar */}
            <div className="space-y-2">
              <Label htmlFor="character-search">Search Characters</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="character-search"
                  placeholder="Search by name, profession, or level..."
                  value={characterSearchTerm}
                  onChange={(e) => setCharacterSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Characters List */}
            <div className="space-y-3">
              {filteredCharacters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {characterSearchTerm ? 'No characters found matching your search.' : 'No characters available.'}
                </div>
              ) : (
                filteredCharacters.map((character) => (
                  <Card 
                    key={character.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleCharacterSelect(character)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{character.name}</h3>
                              {character.position?.co_owner && (
                                <Badge variant="secondary" className="text-xs">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Co-Owner
                                </Badge>
                              )}
                              {character.is_member && (
                                <Badge variant="outline" className="text-xs">
                                  Member
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getDisplayProfession(character)} • Level {character.total_level}
                              {character.highest_level > 0 && ` (Highest: ${character.highest_level})`}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          {isCharacterSwitch ? 'Switch' : 'Select'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing state
  if (step === 'confirming') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {isCharacterSwitch ? 'Switching Character...' : 'Joining Settlement...'}
                </h3>
                <p className="text-muted-foreground">
                  {isCharacterSwitch 
                    ? `Switching to ${selectedCharacter?.name}...`
                    : `Setting up ${selectedCharacter?.name} in ${settlementData.settlement.name}...`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (step === 'complete') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full w-fit mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {isCharacterSwitch ? 'Character Switched!' : 'Successfully Joined!'}
                </h3>
                <p className="text-muted-foreground">
                  {isCharacterSwitch 
                    ? `You are now playing as ${selectedCharacter?.name}`
                    : `${selectedCharacter?.name} has joined ${settlementData.settlement.name}`}
                </p>
              </div>
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
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-destructive/10 rounded-full w-fit mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {isCharacterSwitch ? 'Switch Failed' : 'Join Failed'}
                </h3>
                <Alert className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleRetry}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
