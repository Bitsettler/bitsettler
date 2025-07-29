'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Container } from './container';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Search, Users, Coins, Building, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { SettlementInviteCodeDisplay } from './settlement-invite-code';
import { SettlementConnectionProgress } from './settlement-connection-progress';
import { useSelectedSettlement, Settlement } from '../hooks/use-selected-settlement';

interface SettlementOnboardingProps {
  onSettlementSelected: (settlement: Settlement) => void;
}

export function SettlementOnboarding({ onSettlementSelected }: SettlementOnboardingProps) {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showConnectionProgress, setShowConnectionProgress] = useState(false);

  const { regenerateInviteCode, inviteCode } = useSelectedSettlement();

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
    onSettlementSelected(settlement);
    setShowConnectionProgress(false);
    setShowInviteCode(true);
  };

  const handleConnectionCancel = () => {
    setShowConnectionProgress(false);
    setSelectedSettlement(null);
  };

  const handleContinueToApp = () => {
    if (selectedSettlement) {
      onSettlementSelected(selectedSettlement);
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Container>
    );
  }

  // If not authenticated, this should be handled by the parent component
  if (!session) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please sign in to continue.</p>
        </div>
      </Container>
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
      <Container>
        <div className="space-y-8 py-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Settlement Connected!</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
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
      </Container>
    );
  }

  // Main settlement search interface
  return (
    <Container>
      <div className="space-y-8 py-8">
        {/* Header with authenticated user info */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              {session.user && (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {session.user.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight">Welcome{session.user?.name ? `, ${session.user.name}` : ''}!</h1>
                <p className="text-muted-foreground text-lg">Let's connect you to your settlement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settlement Search */}
        <Card className="max-w-2xl mx-auto">
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
                placeholder="Search settlements by name or leader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {hasSearched && settlements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No settlements found. Try a different search term.</p>
              </div>
            )}

            {settlements.length > 0 && (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {settlements.map((settlement) => (
                    <div
                      key={settlement.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSettlement?.id === settlement.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground'
                      }`}
                      onClick={() => handleSettlementSelect(settlement)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{settlement.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Led by {settlement.leaderName}
                          </div>
                        </div>
                        <div className="text-right text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {settlement.population} members
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            {settlement.treasury} treasury
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {settlement.tiles} tiles
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Settlement Selection Confirmation */}
        {selectedSettlement && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Confirm Settlement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2">{selectedSettlement.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Leader:</span>
                    <span>{selectedSettlement.leaderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Treasury:</span>
                    <span className="font-mono">{selectedSettlement.treasury}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Population:</span>
                    <span>{selectedSettlement.population} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Territory:</span>
                    <span>{selectedSettlement.tiles} tiles</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedSettlement(null)} className="flex-1">
                  Choose Different
                </Button>
                <Button onClick={handleConfirmSelection} className="flex-1">
                  Connect to Settlement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Helpful Information */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <p className="font-medium mb-2">🏘️ Don't see your settlement?</p>
            <p>
              Settlement data is synced from the BitCraft game. If your settlement isn't listed, 
              it may be new or the data hasn't been updated yet.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
} 