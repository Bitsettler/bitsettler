'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Container } from '../container';
import { Loader2, User, CheckCircle, Search, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { ProfessionSelector } from '../profession-selector';
import { getDisplayProfession } from '@/lib/utils/profession-utils';

interface SettlementMember {
  id: string;
  entity_id: string;
  name: string;
  top_profession: string;
  primary_profession?: string | null;
  secondary_profession?: string | null;
  total_level: number;
  highest_level: number;
  settlement_id: string;
  is_active: boolean;
}

export function CharacterClaiming() {
  const { data: session, status } = useSession();
  const [members, setMembers] = useState<SettlementMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<SettlementMember | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // Profession selection step
  const [step, setStep] = useState<'character' | 'professions'>('character');
  const [primaryProfession, setPrimaryProfession] = useState<string | undefined>();
  const [secondaryProfession, setSecondaryProfession] = useState<string | undefined>();

  // Extract auth state
  const authLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  // Filter members based on search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) {
      return members;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return members.filter(member => 
      member.name.toLowerCase().includes(searchLower) ||
      getDisplayProfession(member).toLowerCase().includes(searchLower) ||
      member.total_level.toString().includes(searchLower) ||
      member.highest_level.toString().includes(searchLower)
    );
  }, [members, searchTerm]);

  useEffect(() => {
    // Only fetch once when authentication is complete and user is available
    if (!authLoading && isAuthenticated && user && !hasAttemptedFetch) {
      setHasAttemptedFetch(true);
      
      const fetchUnclaimedMembers = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch('/api/auth/unclaimed-members');
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch members');
          }

          setMembers(result.data || []);
        } catch (err) {
          console.error('Failed to fetch unclaimed members:', err);
          setError(err instanceof Error ? err.message : 'Failed to load characters');
        } finally {
          setLoading(false);
        }
      };
      
      fetchUnclaimedMembers();
    } else if (!authLoading && !isAuthenticated) {
      // Handle unauthenticated state
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user, hasAttemptedFetch]);



  // Navigate to profession selection step
  const proceedToProfessions = () => {
    if (!selectedCharacter) return;
    setStep('professions');
    setError(null);
  };

  // Go back to character selection
  const backToCharacterSelection = () => {
    setStep('character');
    setError(null);
  };

  const claimCharacter = async () => {
    if (!session?.user?.id || !selectedCharacter) {
      setError('Must be signed in and have a character selected');
      return;
    }

    try {
      setClaiming(selectedCharacter.id);
      setError(null);

      const result = await api.post('/api/settlement/claim-character', {
        characterId: selectedCharacter.id,
        settlementId: selectedCharacter.settlement_id,
        displayName: customDisplayName.trim() || undefined,
        primaryProfession,
        secondaryProfession
      });

      if (result.success) {
        // Redirect to settlement dashboard
        window.location.href = '/en/settlement';
      } else {
        throw new Error(result.error || 'Failed to claim character');
      }
    } catch (err) {
      console.error('Failed to claim character:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim character');
    } finally {
      setClaiming(null);
    }
  };

  // Show loading while auth is loading or while fetching characters
  if (authLoading || loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">
              {authLoading ? 'Checking authentication...' : 'Loading available characters...'}
            </p>
          </div>
        </div>
      </Container>
    );
  }

  // Show error if user is not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <Container>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must be signed in to claim a character. Please sign in and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  if (members.length === 0) {
    return (
      <Container>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>No Characters Available</CardTitle>
            <CardDescription>
              There are no unclaimed settlement members available for linking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Settlement members will become available when they're synced from the game.
              Please check back later or contact an administrator.
            </p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Step indicator for UI
  const isCharacterStep = step === 'character';
  const isProfessionStep = step === 'professions';

  return (
    <Container>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-8">
          <div className={`flex items-center space-x-2 ${isCharacterStep ? 'text-primary' : isProfessionStep ? 'text-muted-foreground' : 'text-primary'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCharacterStep ? 'border-primary bg-primary text-primary-foreground' : isProfessionStep ? 'border-muted bg-background text-muted-foreground' : 'border-primary bg-primary text-primary-foreground'}`}>
              {isProfessionStep && selectedCharacter ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="font-medium">Choose Character</span>
          </div>
          <div className={`w-12 h-px ${isProfessionStep ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center space-x-2 ${isProfessionStep ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isProfessionStep ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'}`}>
              2
            </div>
            <span className="font-medium">Select Professions</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            {isCharacterStep ? 'Claim Your Character' : 'Choose Your Professions'}
          </h1>
          <p className="text-muted-foreground">
            {isCharacterStep 
              ? 'Select your in-game character to link it with your account'
              : 'Define your primary and secondary professions to represent your playstyle'
            }
          </p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Character Selection Step */}
        {isCharacterStep && (
          <>
            {/* Search Field */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by character name, profession, or level..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {searchTerm && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing {filteredMembers.length} of {members.length} characters
                  </p>
                )}
              </CardContent>
            </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
            <Card 
              key={member.id} 
              className={`cursor-pointer transition-all border-2 ${
                selectedCharacter?.id === member.id 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border hover:border-primary/50 hover:shadow-md'
              }`}
              onClick={() => setSelectedCharacter(member)}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getDisplayProfession(member)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Level {member.highest_level}
                  </Badge>
                  <Badge variant="outline">
                    Total: {member.total_level}
                  </Badge>
                  {member.is_active && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Action Button - appears when this character is selected */}
                {selectedCharacter?.id === member.id && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`display-name-${member.id}`} className="text-xs">
                        Display Name (Optional)
                      </Label>
                      <Input
                        id={`display-name-${member.id}`}
                        placeholder={member.name}
                        value={customDisplayName}
                        onChange={(e) => setCustomDisplayName(e.target.value)}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to use your character name
                      </p>
                    </div>

                    <Button 
                      onClick={proceedToProfessions}
                      className="w-full"
                      size="sm"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Continue to Professions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No characters found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
            </div>
            
            {/* Help Message */}
            {!selectedCharacter && members.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Click on a character card above to select and claim your character
                </p>
              </div>
            )}
          </>
        )}

        {/* Profession Selection Step */}
        {isProfessionStep && selectedCharacter && (
          <>
            {/* Selected Character Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {selectedCharacter.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedCharacter.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Level {selectedCharacter.highest_level} • {getDisplayProfession(selectedCharacter)}
                    </p>
                    {customDisplayName && (
                      <p className="text-xs text-muted-foreground">
                        Display name: {customDisplayName}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={backToCharacterSelection}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Change Character
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profession Selector */}
            <ProfessionSelector
              primaryProfession={primaryProfession}
              secondaryProfession={secondaryProfession}
              onPrimaryChange={setPrimaryProfession}
              onSecondaryChange={setSecondaryProfession}
              allowNone={true}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={backToCharacterSelection}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Character Selection
              </Button>
              
              <Button 
                onClick={claimCharacter}
                disabled={claiming === selectedCharacter.id}
                className="min-w-[200px]"
              >
                {claiming === selectedCharacter.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Claiming Character...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Claim {selectedCharacter.name}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Container>
  );
} 