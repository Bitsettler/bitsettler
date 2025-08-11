'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import '@/styles/settlement-tiers.css';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SettlementTierIcon } from '@/components/ui/tier-icon';
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
  Clock,
  X
} from 'lucide-react';
import { getDisplayProfession } from '@/lib/utils/profession-utils';
import { clog } from '@/lib/utils/client-logger';

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
  tier: number;
  tiles: number;
  treasury: number;
  regionName?: string;
  regionId?: number;
}

interface CharacterOption {
  id: string;
  name: string;
  settlement_id: string;
  player_entity_id: string; // PRIMARY: Stable BitJita player character ID
  entity_id?: string;       // SECONDARY: Generic BitJita entity ID
  claim_entity_id?: string; // Settlement claim ID
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
  const [hasSearched, setHasSearched] = useState(false);
  const [characterSearchTerm, setCharacterSearchTerm] = useState('');
  
  // Filter characters based on search term
  const filteredCharacters = useMemo(() => {
    if (!characterSearchTerm.trim()) {
      return availableCharacters;
    }
    
    const searchLower = characterSearchTerm.toLowerCase();
    return availableCharacters.filter(character => 
      character.name?.toLowerCase().includes(searchLower) ||
      getDisplayProfession(character)?.toLowerCase().includes(searchLower) ||
      (character.total_level?.toString() || '').includes(searchLower) ||
      (character.highest_level?.toString() || '').includes(searchLower)
    );
  }, [availableCharacters, characterSearchTerm]);
  
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
        // ALWAYS go to character claiming step after successful establishment
        // Users should be able to claim their character regardless of BitJita member data
        setStep('verify');
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

  // Debounced search function for live search
  const searchSettlements = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await api.get(`/api/settlement/search?q=${encodeURIComponent(query.trim())}&page=1`);

      if (result.success) {
        console.log(`✅ Found ${result.data.settlements.length} settlements for "${query}"`);
        setSearchResults(result.data.settlements);
        setHasSearched(true);
        
        // Auto-advance to select step if we have results
        if (result.data.settlements.length > 0) {
          setStep('select');
        }
      } else {
        console.error('❌ Settlement search failed:', result.error);
        setSearchResults([]);
        setHasSearched(true);
      }
    } catch (err) {
      console.error('❌ Network error during settlement search:', err);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input for live search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSettlements(searchQuery);
    }, 500); // 500ms delay for better UX

    return () => clearTimeout(timer);
  }, [searchQuery, searchSettlements]);

  const handleSelectSettlement = async (settlement: GameSettlement) => {
    setSelectedSettlement(settlement);
    setStep('verify');

    try {
      // Fetch character data from OUR database (not BitJita)
      const result = await api.get(`/api/settlement/members?settlementId=${settlement.id}`);

      if (result.success && result.data.members && result.data.members.length > 0) {
        clog.info('Found settlement members in database', {
          memberCount: result.data.members.length,
          settlementName: settlement.name,
          settlementId: settlement.id,
          component: 'SettlementEstablishFlow',
          operation: 'LOAD_SETTLEMENT_CHARACTERS'
        });
        
        // Transform database data to character format
        const characters = result.data.members.map((member: { 
          id: string;
          entity_id: string; 
          name: string; 
          settlement_id: string; 
          skills?: Record<string, number>; 
          permissions?: any;
          top_profession?: string;
          total_level?: number;
          highest_level?: number;
          bitjita_user_id?: string;
          inventory_permission?: number;
          build_permission?: number;
          officer_permission?: number;
          co_owner_permission?: number;
        }) => {
          console.log('🔍 Mapping member:', { id: member.id, entity_id: member.entity_id, name: member.name });
          return {
            id: member.id,
            name: member.name,
            settlement_id: settlement.id,
            entity_id: member.entity_id,
            bitjita_user_id: member.bitjita_user_id,
            skills: member.skills || {},
            top_profession: member.top_profession || 'Unknown',
            total_level: member.total_level || 0,
            highest_level: member.highest_level || 0,
            permissions: {
              inventory: (member.inventory_permission || 0) > 0,
              build: (member.build_permission || 0) > 0,
              officer: (member.officer_permission || 0) > 0,
              co_owner: (member.co_owner_permission || 0) > 0
            }
          };
        });

        setAvailableCharacters(characters);
      } else {
        console.log(`🔍 No members in database for ${settlement.name}, fetching from BitJita...`);
        
        // Fetch characters directly from BitJita API since our database is empty
        try {
          const rosterResult = await api.get(`/api/settlement/roster?settlementId=${settlement.id}`);
          
          if (rosterResult.success && rosterResult.data.members && rosterResult.data.members.length > 0) {
            console.log(`✅ Found ${rosterResult.data.members.length} characters from BitJita for ${settlement.name}`);
            console.log('🔍 First member raw data:', rosterResult.data.members[0]);
            
            // Transform BitJita roster data to character format
            const bitjitaCharacters = rosterResult.data.members.map((member: any) => ({
              id: member.playerEntityId, // Use player_entity_id as primary ID
              name: member.userName,
              settlement_id: settlement.id,
              player_entity_id: member.playerEntityId, // PRIMARY: Stable player character ID
              entity_id: member.entityId,              // SECONDARY: Generic entity ID
              claim_entity_id: member.claimEntityId,   // Settlement claim ID
              bitjita_user_id: member.playerEntityId,
              skills: {},
              top_profession: 'Settler',
              total_level: 1,
              permissions: {
                inventory: Boolean(member.inventoryPermission),
                build: Boolean(member.buildPermission),
                officer: Boolean(member.officerPermission),
                co_owner: Boolean(member.coOwnerPermission)
              }
            }));
            
            console.log('🎭 Transformed characters:', bitjitaCharacters.slice(0, 3));
            console.log(`📋 Setting ${bitjitaCharacters.length} available characters`);
            setAvailableCharacters(bitjitaCharacters);
          } else {
            console.warn(`⚠️ No members found in BitJita either for ${settlement.name}`);
            // Only show founder mode if truly no members exist anywhere
            setAvailableCharacters([]);
          }
        } catch (fetchError) {
          console.error(`❌ Failed to fetch from BitJita for ${settlement.name}:`, fetchError);
          setAvailableCharacters([]);
        }
      }
    } catch (err) {
      console.error('❌ Failed to load settlement character data:', err);
      setError('Failed to load settlement data. Please try again.');
      setStep('error');
    }
  };

  const handleEstablishSettlement = async () => {
    if (!selectedSettlement) return;

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
          // No characters from establishment API, but user should still be able to claim
          console.log('⚠️ No characters returned from establishment API, but proceeding to character claiming');
          // Keep any fallback characters that might exist, or create a basic one
          if (availableCharacters.length === 0) {
            // Generate a numeric player_entity_id that matches validation pattern
            const numericPlayerId = Date.now().toString(); // Use timestamp for unique numeric ID
            setAvailableCharacters([{
              id: numericPlayerId,
              name: 'Your Character',
              settlement_id: selectedSettlement.id,
              player_entity_id: numericPlayerId, // Use numeric ID that passes validation
              entity_id: `entity_${numericPlayerId}`,
              claim_entity_id: `claim_${numericPlayerId}`,
              bitjita_user_id: `user_${numericPlayerId}`,
              skills: {},
              top_profession: 'New Resident',
              total_level: 0,
              permissions: {
                inventory: true,
                build: true,
                officer: true,
                co_owner: true
              }
            }]);
          }
          // Stay on verify step to allow character claiming
          setStep('verify');
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
    // Auto-select the character if there's only one available (e.g., auto-created character)
    const characterToUse = selectedCharacter || (availableCharacters.length === 1 ? availableCharacters[0] : null);
    
    if (!characterToUse || !selectedSettlement) return;

    console.log('🎯 Claiming character:', {
      characterId: characterToUse.id,
      characterPlayerEntityId: characterToUse.player_entity_id,
      characterName: characterToUse.name,
      settlementId: selectedSettlement.id
    });

    setStep('establishing');
    
    // Debug the exact data being sent
    const requestData = {
      playerEntityId: characterToUse.player_entity_id, // Use player_entity_id for stability
      settlementId: selectedSettlement.id,
      displayName: null,
      primaryProfession: null,
      secondaryProfession: null
    };
    
    console.log('🔍 Character claim request data:', requestData);
    console.log('🔍 Character object:', characterToUse);
    console.log('🔍 Settlement object:', selectedSettlement);
    
    try {
      // Run progress simulation and API call in parallel
      const [_, result] = await Promise.all([
        simulateProgress(true), // Character claim progress (faster)
        api.post('/api/settlement/claim-character', requestData)
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
              <div className="relative">
                <Input
                  id="settlement-search"
                  placeholder="Type to search settlements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Search className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Show helpful text when typing */}
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Type at least 2 characters to search...</p>
                </div>
              )}

              {/* Show no results only after we've actually searched */}
              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && hasSearched && (
                <div className="text-center py-4 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No settlements found matching "{searchQuery}"</p>
                  <p className="text-xs mt-1">Try a different search term or check spelling</p>
                </div>
              )}
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
                            <SettlementTierIcon tier={settlement.tier} />
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
                              <Building2 className="w-4 h-4" />
                              <span>Tier {settlement.tier}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{settlement.regionName || settlement.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{settlement.memberCount} members</span>
                            </div>
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
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Claim Your Character</CardTitle>
            <CardDescription>
              Select your character from {selectedSettlement?.name} to continue
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
              <Label className="text-base font-semibold">Available Characters</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Choose your character from this settlement to claim and continue
              </p>
              
              {/* Character Search */}
              {availableCharacters.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by character name, profession, or level..."
                      value={characterSearchTerm}
                      onChange={(e) => setCharacterSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {characterSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCharacterSearchTerm('')}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {characterSearchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing {filteredCharacters.length} of {availableCharacters.length} characters
                    </p>
                  )}
                </div>
              )}
              
              {availableCharacters.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="w-12 h-12 mx-auto text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Welcome, Settlement Founder!</h3>
                  <p className="text-muted-foreground">
                    You'll be the first member of this settlement. We'll set up your character automatically.
                  </p>
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="font-semibold text-lg mb-2">No characters found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms to find your character.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-[500px] overflow-y-auto">
                  {filteredCharacters.map((character) => (
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
                onClick={establishData && availableCharacters.length !== 0 ? handleClaimCharacter : handleEstablishSettlement} 
                disabled={filteredCharacters.length > 0 && !selectedCharacter}
                className="flex-1"
              >
                {availableCharacters.length === 0 
                  ? 'Create Settlement (No Members Found)' 
                  : 'Claim Character'
                }
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