'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Search, Users, Coins, Building, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { SettlementInviteCodeDisplay } from './settlement-invite-code';
import { useSelectedSettlement, Settlement } from '../hooks/use-selected-settlement';

interface SettlementOnboardingProps {
  onSettlementSelected: (settlement: Settlement) => void;
}

export function SettlementOnboarding({ onSettlementSelected }: SettlementOnboardingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);

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
      onSettlementSelected(selectedSettlement);
      setShowInviteCode(true);
    }
  };

  const handleContinueToApp = () => {
    // This will trigger the parent component to show the dashboard
    if (selectedSettlement) {
      onSettlementSelected(selectedSettlement);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome to Settlement Management</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          To get started, you'll need to connect to your settlement. Search for your settlement name below
          to access all the management features.
        </p>
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