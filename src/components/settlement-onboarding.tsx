'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { ProfessionAvatar } from './profession-avatar';
import { PROFESSIONS } from '../constants/professions';
import { Search, Users, Coins, Building, MapPin, Loader2, ArrowRight, User, Sparkles } from 'lucide-react';
import { SettlementInviteCodeDisplay } from './settlement-invite-code';
import { SettlementConnectionProgress } from './settlement-connection-progress';
import { useSelectedSettlement, Settlement } from '../hooks/use-selected-settlement';
import { useUserProfile } from '../hooks/use-user-profile';

interface SettlementOnboardingProps {
  onSettlementSelected: (settlement: Settlement) => void;
}

const WELCOME_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
];

function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function SettlementOnboarding({ onSettlementSelected }: SettlementOnboardingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showConnectionProgress, setShowConnectionProgress] = useState(false);
  
  // Profile setup state
  const [profileStep, setProfileStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    discordHandle: '',
    inGameName: '',
    profileColor: WELCOME_COLORS[0],
    profession: ''
  });
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const { regenerateInviteCode, inviteCode } = useSelectedSettlement();
  const { profile, isLoading: profileLoading, updateProfile, isFirstTime } = useUserProfile();

  // Debounced search function
  const searchSettlements = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSettlements([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/settlement/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        setSettlements(data.settlements);
        setHasSearched(true);
      } else {
        console.error('Search failed:', data.error);
        setSettlements([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSettlements([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSettlements(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchSettlements]);

  const handleSettlementSelect = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
  };

  const handleConfirmSelection = () => {
    if (selectedSettlement) {
      setShowConnectionProgress(true);
    }
  };

  const handleConnectionComplete = (settlement: Settlement, syncResult: any) => {
    // Mark settlement as selected in context
    onSettlementSelected(settlement);
    setShowConnectionProgress(false);
    setShowInviteCode(true);
  };

  const handleConnectionCancel = () => {
    setShowConnectionProgress(false);
    setSelectedSettlement(null);
  };

  const handleContinueToApp = () => {
    // This will trigger the parent component to show the dashboard
    if (selectedSettlement) {
      onSettlementSelected(selectedSettlement);
    }
  };

  // Profile setup handlers
  const handleProfileNext = () => {
    if (profileStep < 4) {
      setProfileStep(profileStep + 1);
    }
  };

  const handleProfileBack = () => {
    if (profileStep > 1) {
      setProfileStep(profileStep - 1);
    }
  };

  const handleCompleteProfile = () => {
    if (!formData.displayName.trim()) {
      return;
    }

    setIsCreatingProfile(true);
    
    try {
      updateProfile({
        displayName: formData.displayName.trim(),
        discordHandle: formData.discordHandle.trim() || undefined,
        inGameName: formData.inGameName.trim() || undefined,
        profileColor: formData.profileColor,
        profileInitials: generateInitials(formData.displayName.trim()),
        profession: formData.profession || undefined,
      });

      // Brief delay to show success, then continue to settlement search
      setTimeout(() => {
        setIsCreatingProfile(false);
        // Profile is now complete, component will re-render and show settlement search
      }, 500);
    } catch (error) {
      console.error('Error creating profile:', error);
      setIsCreatingProfile(false);
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, profileColor: color }));
  };

  const canProceedProfile = () => {
    switch (profileStep) {
      case 1:
        return formData.displayName.trim().length > 0;
      case 2:
        return true; // Optional step
      case 3:
        return true; // Optional step
      case 4:
        return true; // Always can complete
      default:
        return false;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // If profile is still loading, show loading state
  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If first time user, show profile setup flow
  if (isFirstTime || !profile) {
    const renderProfileStep1 = () => (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome to BitCraft.Guide!</h2>
            <p className="text-muted-foreground">
              Let's set up your profile before connecting to a settlement
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What should we call you?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter your display name"
                autoFocus
              />
            </div>
            
            {formData.displayName && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <ProfessionAvatar
                  profession={formData.profession}
                  displayName={formData.displayName}
                  profileColor={formData.profileColor}
                  profileInitials={generateInitials(formData.displayName)}
                  size="md"
                />
                <div>
                  <p className="font-medium">{formData.displayName}</p>
                  <p className="text-sm text-muted-foreground">This is how you'll appear in settlements</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );

    const renderProfileStep2 = () => (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Connect with Others</h2>
          <p className="text-muted-foreground">
            Add your game handles so settlement members can find you (optional)
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inGameName">BitCraft Character Name</Label>
              <Input
                id="inGameName"
                value={formData.inGameName}
                onChange={(e) => setFormData(prev => ({ ...prev, inGameName: e.target.value }))}
                placeholder="Your in-game character name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discordHandle">Discord Handle</Label>
              <Input
                id="discordHandle"
                value={formData.discordHandle}
                onChange={(e) => setFormData(prev => ({ ...prev, discordHandle: e.target.value }))}
                placeholder="@username or username#1234"
              />
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
              💡 These help settlement members contact you outside the game. You can always change these later in your profile.
            </div>
          </CardContent>
        </Card>
      </div>
    );

    const renderProfileStep3 = () => (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Choose Your Style</h2>
          <p className="text-muted-foreground">
            Pick a color for your profile avatar
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex justify-center">
              <ProfessionAvatar
                profession={formData.profession}
                displayName={formData.displayName}
                profileColor={formData.profileColor}
                profileInitials={generateInitials(formData.displayName)}
                size="xl"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Profile Color</Label>
              <div className="grid grid-cols-4 gap-3">
                {WELCOME_COLORS.map(color => (
                  <button
                    key={color}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      formData.profileColor === color 
                        ? 'border-foreground scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                ✨ Great! One more optional step
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
          );

    const renderProfileStep4 = () => (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Choose Your Avatar Style</h2>
          <p className="text-muted-foreground">
            Select a profession avatar or stick with your color theme
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex justify-center">
              <ProfessionAvatar
                profession={formData.profession}
                displayName={formData.displayName}
                profileColor={formData.profileColor}
                profileInitials={generateInitials(formData.displayName)}
                size="xl"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Profession Avatar (Optional)</Label>
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {/* Color-only option first */}
                <button
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.profession === '' 
                      ? 'border-foreground bg-accent' 
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, profession: '' }))}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: formData.profileColor }}
                    >
                      {generateInitials(formData.displayName)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Color Theme</p>
                      <p className="text-xs text-muted-foreground">Just use your chosen color</p>
                    </div>
                  </div>
                </button>

                {/* Profession options */}
                {PROFESSIONS.map(profession => (
                  <button
                    key={profession.id}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      formData.profession === profession.id 
                        ? 'border-foreground bg-accent' 
                        : 'border-muted hover:border-muted-foreground'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, profession: profession.id }))}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: profession.fallbackColor }}
                      >
                        {generateInitials(formData.displayName)}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{profession.name}</p>
                        <p className="text-xs text-muted-foreground">{profession.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                🎉 Perfect! Now let's find your settlement
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(stepNum => (
            <div
              key={stepNum}
              className={`w-3 h-3 rounded-full transition-colors ${
                profileStep >= stepNum ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {profileStep === 1 && renderProfileStep1()}
        {profileStep === 2 && renderProfileStep2()}
        {profileStep === 3 && renderProfileStep3()}
        {profileStep === 4 && renderProfileStep4()}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <div>
            {profileStep > 1 && (
              <Button variant="outline" onClick={handleProfileBack}>
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {profileStep < 4 ? (
              <Button 
                onClick={handleProfileNext} 
                disabled={!canProceedProfile()}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={handleCompleteProfile}
                  disabled={isCreatingProfile}
                >
                  Skip & Continue
                </Button>
                <Button 
                  onClick={handleCompleteProfile}
                  disabled={!canProceedProfile() || isCreatingProfile}
                >
                  {isCreatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete & Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If showing connection progress, render the progress screen
  if (showConnectionProgress && selectedSettlement) {
    return (
      <SettlementConnectionProgress
        settlement={selectedSettlement}
        onConnectionComplete={handleConnectionComplete}
        onCancel={handleConnectionCancel}
      />
    );
  }

  // If showing invite code, render the invite code screen
  if (showInviteCode && inviteCode) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Settlement Connected!</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your settlement has been connected successfully. Here's your invite code to share with others.
          </p>
        </div>

        {/* Invite Code Display */}
        <SettlementInviteCodeDisplay 
          inviteCode={inviteCode}
          onRegenerate={regenerateInviteCode}
        />

        {/* Continue to App */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="font-semibold">Ready to explore your settlement?</h3>
              <p className="text-muted-foreground text-sm">
                Access your dashboard to view members, projects, treasury, and more.
              </p>
              <Button onClick={handleContinueToApp} size="lg" className="w-full">
                Continue to Settlement Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main settlement search flow (shown after profile is complete)
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          {profile && (
            <ProfessionAvatar
              profession={profile.profession}
              displayName={profile.displayName}
              profileColor={profile.profileColor}
              profileInitials={profile.profileInitials}
              size="lg"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">Welcome{profile ? `, ${profile.displayName}` : ''}!</h1>
            <p className="text-muted-foreground">Let's connect you to your settlement</p>
          </div>
        </div>
      </div>

      {/* Settlement Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Your Settlement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type your settlement name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {settlements.length === 0 
                    ? 'No settlements found' 
                    : `Found ${settlements.length} settlement${settlements.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>

              {settlements.length > 0 && (
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {settlements.map((settlement) => (
                      <Card 
                        key={settlement.id}
                        className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                          selectedSettlement?.id === settlement.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleSettlementSelect(settlement)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold">{settlement.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  Tier {settlement.tier}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {formatNumber(settlement.population)} members
                                </div>
                                <div className="flex items-center gap-1">
                                  <Coins className="h-3 w-3" />
                                  {formatNumber(settlement.treasury)} treasury
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {formatNumber(settlement.tiles)} tiles
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {selectedSettlement?.id === settlement.id ? 'Selected' : 'Select'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement Preview & Confirmation */}
      {selectedSettlement && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{selectedSettlement.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Settlement Tier:</span>
                    <Badge variant="secondary">Tier {selectedSettlement.tier}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Treasury:</span>
                    <span className="font-mono">{formatNumber(selectedSettlement.treasury)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Population:</span>
                    <span>{formatNumber(selectedSettlement.population)} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Territory:</span>
                    <span>{formatNumber(selectedSettlement.tiles)} tiles</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">What you'll get access to:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Settlement dashboard and statistics</li>
                  <li>• Member directory and activity tracking</li>
                  <li>• Project management and progress tracking</li>
                  <li>• Treasury management and transaction history</li>
                  <li>• Real-time updates and notifications</li>
                  <li>• <strong>Invite code to share with others</strong></li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="flex justify-center">
              <Button 
                onClick={handleConfirmSelection}
                size="lg"
                className="px-8"
              >
                Connect to {selectedSettlement.name}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 