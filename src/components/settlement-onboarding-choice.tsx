'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TierIcon } from '@/components/ui/tier-icon';
import { 
  Users, 
  Building2, 
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  Activity,
  Crown,
  Loader2
} from 'lucide-react';

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

interface SettlementOnboardingChoiceProps {
  onEstablishSettlement: (settlement: GameSettlement) => void;
}

export function SettlementOnboardingChoice({ 
  onEstablishSettlement 
}: SettlementOnboardingChoiceProps) {

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GameSettlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<GameSettlement | null>(null);
  const [isEstablishing, setIsEstablishing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function for live search
  const searchSettlements = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      setSelectedSettlement(null);
      return;
    }

    setIsSearching(true);
    setSelectedSettlement(null); // Clear previous selection
    try {
      const response = await fetch(`/api/settlement/search?q=${encodeURIComponent(query.trim())}&page=1`);
      const result = await response.json();

      if (result.success) {
        console.log(`✅ Found ${result.data.settlements.length} settlements for "${query}"`);
        setSearchResults(result.data.settlements);
        setHasSearched(true);
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

  const handleSelectSettlement = (settlement: GameSettlement) => {
    setSelectedSettlement(settlement);
  };

  const handleEstablishSubmit = async () => {
    if (!selectedSettlement || isEstablishing) return;

    setIsEstablishing(true);
    try {
      const result = await api.post('/api/settlement/establish', {
        settlementId: selectedSettlement.id,
        settlementName: selectedSettlement.name
      });

      if (result.success) {
        console.log('✅ Settlement established:', result.data.settlement.name);
        console.log('👥 Available characters:', result.data.availableCharacters.length);
        
        // Pass settlement and character data to establish flow
        onEstablishSettlement({
          settlement: result.data.settlement,
          availableCharacters: result.data.availableCharacters
        });
      } else {
        console.error('❌ Failed to establish settlement:', result.error);
        // TODO: Show proper error message to user
        alert(`Failed to establish settlement: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Network error during settlement establishment:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsEstablishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Welcome to Settlement Management</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          To get started, search for your settlement from the game data and establish management.
        </p>
      </div>

      {/* Settlement Search */}
      <div className="max-w-2xl mx-auto">
        <Card className="transition-all border-2 hover:shadow-lg border-border hover:border-primary/50">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl">Establish Settlement</CardTitle>
              <CardDescription className="text-base">
                Set up management for your settlement using game data.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settlement-search" className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Settlement Name</span>
              </Label>
              <div className="relative">
                <Input
                  id="settlement-search"
                  placeholder="Type to search settlements..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedSettlement(null); // Clear selection when typing
                  }}
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
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium">Found {searchResults.length} settlement(s):</p>
                {searchResults.map((settlement) => (
                  <Card 
                    key={settlement.id}
                    className={`cursor-pointer transition-all border-2 p-3 ${
                      selectedSettlement?.id === settlement.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleSelectSettlement(settlement)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TierIcon tier={settlement.tier} size="sm" variant="game-asset" />
                          <h4 className="font-medium text-sm">{settlement.name}</h4>
                        </div>
                        {settlement.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            <Activity className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3 h-3" />
                          <span>Tier {settlement.tier}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{settlement.regionName || settlement.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{settlement.tiles} tiles</span>
                        </div>
                      </div>
                      {settlement.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{settlement.description}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Show helpful text when typing */}
            {searchQuery.length > 0 && searchQuery.length < 2 && !isSearching && (
              <div className="text-center py-4 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Type at least 2 characters to search...</p>
              </div>
            )}

            {/* Show no results only after we've actually searched */}
            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && hasSearched && (
              <div className="text-center py-4 text-muted-foreground">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No settlements found matching "{searchQuery}"</p>
                <p className="text-xs mt-1">Try a different search term or check spelling</p>
              </div>
            )}

            <Button 
              onClick={handleEstablishSubmit}
              disabled={!selectedSettlement || isEstablishing}
              className="w-full"
              size="lg"
            >
              {isEstablishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Establishing...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Establish Settlement
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="space-y-1 text-xs">
                <li>• Search game settlements</li>
                <li>• Verify ownership</li>
                <li>• Import member data</li>
                <li>• Become settlement owner</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2" />
          Settlement Management Features
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="font-medium">Project Management</div>
            <div className="text-muted-foreground">Track settlement projects and resource needs</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium">Member Skills</div>
            <div className="text-muted-foreground">View and analyze member skills and professions</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium">Treasury Tracking</div>
            <div className="text-muted-foreground">Monitor settlement finances and transactions</div>
          </div>
        </div>
      </div>
    </div>
  );
}