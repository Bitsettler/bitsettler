'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  MapPin,
  Building2,
  Loader2,
  Crown,
  Activity
} from 'lucide-react';

interface SettlementEstablishFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

interface GameSettlement {
  id: string;
  name: string;
  memberCount: number;
  location: string;
  description?: string;
  isActive: boolean;
  owner?: string;
  lastActive: string;
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
  permissions: {
    inventory: boolean;
    build: boolean;
    officer: boolean;
    co_owner: boolean;
  };
}

export function SettlementEstablishFlow({ onBack, onComplete }: SettlementEstablishFlowProps) {
  const [step, setStep] = useState<'search' | 'select' | 'verify' | 'establishing' | 'complete' | 'error'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GameSettlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<GameSettlement | null>(null);
  const [availableCharacters, setAvailableCharacters] = useState<CharacterOption[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterOption | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // TODO: Replace with actual BitJita API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock search results
      const mockResults: GameSettlement[] = [
        {
          id: 'settlement_1',
          name: 'Ironforge Trading Company',
          memberCount: 23,
          location: 'Northern Highlands',
          description: 'A thriving trading settlement focused on mining and metallurgy',
          isActive: true,
          owner: 'GuildMaster_Thor',
          lastActive: '2024-01-30T10:30:00Z'
        },
        {
          id: 'settlement_2',
          name: 'Meadowbrook Collective',
          memberCount: 18,
          location: 'Eastern Plains',
          description: 'Agricultural settlement specializing in farming and crafting',
          isActive: true,
          owner: 'Farmer_Jane',
          lastActive: '2024-01-29T15:45:00Z'
        }
      ].filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

      setSearchResults(mockResults);
      setStep('select');
    } catch (err) {
      setError('Failed to search settlements. Please try again.');
      setStep('error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSettlement = async (settlement: GameSettlement) => {
    setSelectedSettlement(settlement);
    setStep('verify');

    try {
      // TODO: Replace with actual API call to get characters in this settlement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock characters for verification
      setAvailableCharacters([
        {
          id: 'char_1',
          name: 'Thorek Ironbeard',
          settlement_id: settlement.id,
          entity_id: 'entity_123',
          bitjita_user_id: '432345564239953880',
          skills: { 'Mining': 45, 'Blacksmithing': 38, 'Trading': 22 },
          top_profession: 'Mining',
          total_level: 105,
          permissions: {
            inventory: true,
            build: true,
            officer: true,
            co_owner: true
          }
        }
      ]);
    } catch (err) {
      setError('Failed to load settlement data. Please try again.');
      setStep('error');
    }
  };

  const handleEstablishSettlement = async () => {
    if (!selectedCharacter || !selectedSettlement) return;

    setStep('establishing');
    try {
      // TODO: Replace with actual API calls
      // 1. Call BitJita API to sync settlement data
      // 2. Create settlement in our database
      // 3. Import all members
      // 4. Claim character for current user
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setStep('complete');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setError('Failed to establish settlement. Please try again.');
      setStep('error');
    }
  };

  if (step === 'search') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-6 h-6" />
              <span>Search Game Settlements</span>
            </CardTitle>
            <CardDescription>
              Find your settlement from the game data to establish management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settlement-search">Settlement Name</Label>
              <div className="flex space-x-2">
                <Input
                  id="settlement-search"
                  placeholder="Enter settlement name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={!searchQuery.trim() || isSearching}>
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                You'll need to verify ownership by claiming a character with management permissions in the settlement.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'select') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchResults.length} settlement(s) matching "{searchQuery}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No settlements found matching your search.</p>
                <p className="text-sm">Try a different name or check the spelling.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((settlement) => (
                  <Card 
                    key={settlement.id}
                    className="cursor-pointer transition-all border-2 hover:border-primary/50"
                    onClick={() => handleSelectSettlement(settlement)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{settlement.name}</h3>
                            {settlement.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                <Activity className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          {settlement.description && (
                            <p className="text-sm text-muted-foreground">{settlement.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{settlement.memberCount} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{settlement.location}</span>
                            </div>
                            {settlement.owner && (
                              <div className="flex items-center space-x-1">
                                <Crown className="w-4 h-4" />
                                <span>{settlement.owner}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep('search')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                New Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Verify Ownership</CardTitle>
            <CardDescription>
              Claim your character to establish management for {selectedSettlement?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Settlement Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{selectedSettlement?.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{selectedSettlement?.memberCount} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedSettlement?.location}</span>
                </div>
              </div>
            </div>

            {/* Character Selection */}
            <div>
              <Label className="text-base font-semibold">Your Characters in this Settlement</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select a character with management permissions to verify ownership
              </p>
              
              {availableCharacters.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {availableCharacters.map((character) => (
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
                              <Crown className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{character.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {character.top_profession} • Level {character.total_level}
                              </p>
                              <div className="flex space-x-2 mt-1">
                                {character.permissions.co_owner && (
                                  <Badge variant="secondary" className="text-xs">Co-Owner</Badge>
                                )}
                                {character.permissions.officer && (
                                  <Badge variant="outline" className="text-xs">Officer</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep('select')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleEstablishSettlement} 
                disabled={!selectedCharacter}
                className="flex-1"
              >
                Establish Settlement Management
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'establishing') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Establishing Settlement</CardTitle>
            <CardDescription>
              Setting up management for {selectedSettlement?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>Syncing settlement data from game...</p>
              <p>Importing member information...</p>
              <p>Setting up management permissions...</p>
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
            <CardTitle>Settlement Established!</CardTitle>
            <CardDescription>
              You now manage {selectedSettlement?.name} as {selectedCharacter?.name}
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

  if (step === 'error') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <CardTitle>Setup Failed</CardTitle>
            <CardDescription>There was a problem establishing the settlement</CardDescription>
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

  return null;
}