'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
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
  Activity,
  Database,
  Shield,
  UserCheck,
  Download,
  Clock
} from 'lucide-react';

interface SettlementEstablishFlowProps {
  establishData?: {
    settlement: Settlement;
    inviteCode: string;
    availableCharacters: CharacterOption[];
  };
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

export function SettlementEstablishFlow({ establishData, onBack, onComplete }: SettlementEstablishFlowProps) {
  const [step, setStep] = useState<'search' | 'select' | 'verify' | 'establishing' | 'complete' | 'error'>(
    establishData ? 'establishing' : 'search'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GameSettlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<GameSettlement | null>(null);
  const [availableCharacters, setAvailableCharacters] = useState<CharacterOption[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Progress tracking for establishment
  const [establishmentProgress, setEstablishmentProgress] = useState({
    currentStep: 0,
    steps: establishData ? [
      { id: 'verify', label: 'Verifying Character', icon: UserCheck, status: 'pending' as const },
      { id: 'setup', label: 'Setting Up Account', icon: Shield, status: 'pending' as const },
      { id: 'activate', label: 'Activating Access', icon: CheckCircle, status: 'pending' as const }
    ] : [
      { id: 'sync', label: 'Syncing Settlement Data', icon: Download, status: 'pending' as const },
      { id: 'import', label: 'Importing Members', icon: Database, status: 'pending' as const },
      { id: 'permissions', label: 'Setting Permissions', icon: Shield, status: 'pending' as const },
      { id: 'finalize', label: 'Finalizing Setup', icon: CheckCircle, status: 'pending' as const }
    ]
  });

  // Initialize data when establishData is provided
  useEffect(() => {
    if (establishData) {
      setSelectedSettlement({
        id: establishData.settlement.id,
        name: establishData.settlement.name,
        memberCount: establishData.availableCharacters.length,
        location: 'Game Settlement',
        description: `Established settlement with invite code: ${establishData.inviteCode}`,
        isActive: true,
        owner: 'Current User',
        lastActive: new Date().toISOString()
      });
      setAvailableCharacters(establishData.availableCharacters);
      
      // Start progress simulation, then transition to character selection
      simulateProgress(true).then(() => {
        if (establishData.availableCharacters.length > 0) {
          setStep('verify'); // Go to character claiming if members were imported
        } else {
          setStep('complete'); // Go directly to success if no members
          // Auto-redirect to dashboard after showing success for 3 seconds
          setTimeout(() => {
            onComplete();
          }, 3000);
        }
      });
    }
  }, [establishData, onComplete]);

  // Progress simulation for visual appeal
  const simulateProgress = async (isCharacterClaim: boolean = false) => {
    const steps = establishmentProgress.steps;
    const stepDelay = isCharacterClaim ? 800 : 1200; // Faster for character claim
    
    for (let i = 0; i < steps.length; i++) {
      // Mark current step as active
      setEstablishmentProgress(prev => ({
        ...prev,
        currentStep: i,
        steps: prev.steps.map((step, index) => ({
          ...step,
          status: index === i ? 'active' : index < i ? 'completed' : 'pending'
        }))
      }));
      
      // Wait for step to complete
      await new Promise(resolve => setTimeout(resolve, stepDelay));
      
      // Mark step as completed
      setEstablishmentProgress(prev => ({
        ...prev,
        steps: prev.steps.map((step, index) => ({
          ...step,
          status: index <= i ? 'completed' : 'pending'
        }))
      }));
      
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const result = await api.get(`/api/settlement/search?q=${encodeURIComponent(searchQuery.trim())}&page=1`);

      if (result.success) {
        console.log(`✅ Found ${result.data.settlements.length} settlements for "${searchQuery}"`);
        setSearchResults(result.data.settlements);
        setStep('select');
      } else {
        console.error('❌ Settlement search failed:', result.error);
        setError(`Search failed: ${result.error}`);
        setStep('error');
      }
    } catch (err) {
      console.error('❌ Network error during settlement search:', err);
      setError('Network error during search. Please try again.');
      setStep('error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSettlement = async (settlement: GameSettlement) => {
    setSelectedSettlement(settlement);
    setStep('verify');

    try {
      // Fetch character data from OUR database (not BitJita)
      const result = await api.get(`/api/settlement/members?settlementId=${settlement.id}`);

      if (result.success && result.data.members && result.data.members.length > 0) {
        console.log(`✅ Found ${result.data.members.length} members in database for settlement ${settlement.name}`);
        
        // Transform database data to character format
        const characters = result.data.members.map((member: { entity_id: string; name: string; settlement_id: string; skills?: Record<string, number>; permissions?: any }) => ({
          id: member.id || member.entity_id,
          name: member.name,
          settlement_id: settlement.id,
          entity_id: member.entity_id,
          bitjita_user_id: member.bitjita_user_id,
          skills: member.skills || {},
          top_profession: member.top_profession || 'Unknown',
          total_level: member.total_level || 0,
          permissions: {
            inventory: (member.inventory_permission || 0) > 0,
            build: (member.build_permission || 0) > 0,
            officer: (member.officer_permission || 0) > 0,
            co_owner: (member.co_owner_permission || 0) > 0
          }
        }));

        setAvailableCharacters(characters);
      } else {
        console.warn(`⚠️ No members found for settlement ${settlement.name}, using fallback character`);
        // Create a fallback character for ownership verification
        setAvailableCharacters([{
          id: 'owner_placeholder',
          name: 'Settlement Owner',
          settlement_id: settlement.id,
          entity_id: 'owner_entity',
          bitjita_user_id: 'owner_user',
          skills: {},
          top_profession: 'Settlement Manager',
          total_level: 1,
          permissions: {
            inventory: true,
            build: true,
            officer: true,
            co_owner: true
          }
        }]);
      }
    } catch (err) {
      console.error('❌ Failed to load settlement character data:', err);
      setError('Failed to load settlement data. Please try again.');
      setStep('error');
    }
  };

  const handleEstablishSettlement = async () => {
    if (!selectedCharacter || !selectedSettlement) return;

    setStep('establishing');
    try {
      // Run progress simulation and API call in parallel
      const [_, result] = await Promise.all([
        simulateProgress(false), // Settlement establishment progress
        api.post('/api/settlement/establish', {
          settlementId: selectedSettlement.id,
          settlementName: selectedSettlement.name
        })
      ]);

      if (result.success) {
        console.log('✅ Settlement established successfully:', result.data);
        
        // Update available characters with real data from establishment
        if (result.data.availableCharacters && result.data.availableCharacters.length > 0) {
          console.log(`🎭 Updated with ${result.data.availableCharacters.length} real characters`);
          setAvailableCharacters(result.data.availableCharacters);
          // Reset character selection so user can choose from real characters
          setSelectedCharacter(null);
          // Go back to verification step to let user select their real character
          setStep('verify');
        } else {
          // No characters to claim, go directly to completion
          setStep('complete');
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      } else {
        setError(result.error || 'Failed to establish settlement');
        setStep('error');
      }
    } catch (err) {
      console.error('❌ Failed to establish settlement:', err);
      setError('Failed to establish settlement. Please try again.');
      setStep('error');
    }
  };

  const handleClaimCharacter = async () => {
    if (!selectedCharacter || !selectedSettlement) return;

    console.log('🎯 Claiming character:', {
      characterId: selectedCharacter.id,
      characterEntityId: selectedCharacter.entity_id,
      characterName: selectedCharacter.name,
      settlementId: selectedSettlement.id
    });

    setStep('establishing');
    try {
      // Run progress simulation and API call in parallel
      const [_, result] = await Promise.all([
        simulateProgress(true), // Character claim progress (faster)
        api.post('/api/settlement/claim-character', {
          characterId: selectedCharacter.entity_id, // Use entity_id instead of id
          settlementId: selectedSettlement.id
        })
      ]);

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
      console.error('❌ Failed to claim character:', err);
      setError('Failed to claim character. Please try again.');
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
                onClick={establishData ? handleClaimCharacter : handleEstablishSettlement} 
                disabled={!selectedCharacter}
                className="flex-1"
              >
                {establishData ? 'Claim Character' : 'Establish Settlement Management'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'establishing') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {establishData ? 'Claiming Character' : 'Establishing Settlement'}
            </CardTitle>
            <CardDescription className="text-lg">
              {establishData 
                ? `Setting up your character in ${selectedSettlement?.name}`
                : `Setting up management for ${selectedSettlement?.name}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Progress Steps */}
            <div className="space-y-6">
              {establishmentProgress.steps.map((progressStep, index) => {
                const IconComponent = progressStep.icon;
                const isActive = progressStep.status === 'active';
                const isCompleted = progressStep.status === 'completed';
                const isPending = progressStep.status === 'pending';
                
                return (
                  <div key={progressStep.id} className="flex items-center space-x-4">
                    {/* Step Icon */}
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500
                      ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                      ${isActive ? 'bg-blue-500 border-blue-500 text-white animate-pulse' : ''}
                      ${isPending ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : isActive ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <IconComponent className="w-6 h-6" />
                      )}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1">
                      <div className={`
                        font-medium transition-all duration-300
                        ${isCompleted ? 'text-green-700' : ''}
                        ${isActive ? 'text-blue-700' : ''}
                        ${isPending ? 'text-gray-500' : ''}
                      `}>
                        {progressStep.label}
                      </div>
                      
                      {/* Progress Bar for Active Step */}
                      {isActive && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full animate-pulse w-full"></div>
                        </div>
                      )}
                      
                      {/* Completed Indicator */}
                      {isCompleted && (
                        <div className="mt-1 text-sm text-green-600 font-medium">
                          ✓ Complete
                        </div>
                      )}
                    </div>
                    
                    {/* Step Number */}
                    <div className={`
                      text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                      ${isActive ? 'bg-blue-100 text-blue-700' : ''}
                      ${isPending ? 'bg-gray-100 text-gray-400' : ''}
                    `}>
                      {index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Overall Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Progress</span>
                <span>{Math.round((establishmentProgress.currentStep + 1) / establishmentProgress.steps.length * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${(establishmentProgress.currentStep + 1) / establishmentProgress.steps.length * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* Status Message */}
            <div className="text-center">
              <p className="text-muted-foreground">
                {establishData 
                  ? "Please wait while we set up your character..."
                  : "Please wait while we establish your settlement..."
                }
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This process usually takes a few moments
              </p>
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
            <CardTitle>
              {establishData && establishData.availableCharacters.length > 0 
                ? 'Character Claimed!' 
                : 'Settlement Established!'
              }
            </CardTitle>
            <CardDescription>
              {establishData && establishData.availableCharacters.length > 0
                ? `Welcome to ${selectedSettlement?.name}! You can now access the settlement dashboard.`
                : `${selectedSettlement?.name} is now ready for management`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {establishData && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Settlement Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Settlement:</span>
                    <span className="font-medium">{establishData.settlement.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invite Code:</span>
                    <code className="font-mono bg-background px-2 py-1 rounded border">
                      {establishData.inviteCode}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members:</span>
                    <span>{establishData.availableCharacters.length}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Redirecting to your settlement dashboard...
              </p>
            </div>
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