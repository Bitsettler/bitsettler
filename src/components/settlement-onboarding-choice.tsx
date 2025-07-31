'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Building2, 
  UserPlus, 
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  Key,
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
}

interface SettlementOnboardingChoiceProps {
  onJoinSettlement: (inviteCode: string) => void;
  onEstablishSettlement: (settlement: GameSettlement) => void;
}

export function SettlementOnboardingChoice({ 
  onJoinSettlement, 
  onEstablishSettlement 
}: SettlementOnboardingChoiceProps) {

  const [inviteCode, setInviteCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GameSettlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<GameSettlement | null>(null);
  const [isEstablishing, setIsEstablishing] = useState(false);

  const handleJoinSubmit = async () => {
    if (!inviteCode.trim()) return;

    try {
      const result = await api.post('/api/settlement/join', {
        inviteCode: inviteCode.trim()
      });

      if (result.success) {
        console.log('✅ Settlement found:', result.data.settlement.name);
        console.log('👥 Available characters:', result.data.availableCharacters.length);
        
        // Pass settlement and character data to join flow
        onJoinSettlement(result.data);
      } else {
        console.error('❌ Failed to join settlement:', result.error);
        // TODO: Show proper error message to user
        alert(`Failed to join settlement: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Network error during settlement join:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedSettlement(null); // Clear previous selection
    try {
      const response = await fetch(`/api/settlement/search?q=${encodeURIComponent(searchQuery.trim())}&page=1`);
      const result = await response.json();

      if (result.success) {
        console.log(`✅ Found ${result.data.settlements.length} settlements for "${searchQuery}"`);
        setSearchResults(result.data.settlements);
      } else {
        console.error('❌ Settlement search failed:', result.error);
        setSearchResults([]);
        // TODO: Show proper error message to user
        alert(`Search failed: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Network error during settlement search:', err);
      setSearchResults([]);
      alert('Network error during search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

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
        console.log('📋 Invite code generated:', result.data.inviteCode);
        console.log('👥 Available characters:', result.data.availableCharacters.length);
        
        // Pass settlement, invite code, and character data to establish flow
        onEstablishSettlement({
          settlement: result.data.settlement,
          inviteCode: result.data.inviteCode,
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
          To get started, you can either join an existing settlement using an invite code, 
          or establish a new settlement from the game data.
        </p>
      </div>

      {/* Choice Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Join Settlement Option */}
        <Card className="transition-all border-2 hover:shadow-lg border-border hover:border-primary/50">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <UserPlus className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl">Join Settlement</CardTitle>
              <CardDescription className="text-base">
                Already a member of a settlement? Use an invite code to connect.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code" className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Invite Code</span>
              </Label>
              <Input
                id="invite-code"
                placeholder="Enter your invite code..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="text-center font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinSubmit()}
              />
            </div>
            <Button 
              onClick={handleJoinSubmit}
              disabled={!inviteCode.trim()}
              className="w-full"
              size="lg"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Join Settlement
            </Button>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="space-y-1 text-xs">
                <li>• Connect to your settlement</li>
                <li>• Claim your in-game character</li>
                <li>• Access settlement dashboard</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Establish Settlement Option */}
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
              <div className="flex space-x-2">
                <Input
                  id="settlement-search"
                  placeholder="Search settlements..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedSettlement(null); // Clear selection when typing
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={!searchQuery.trim() || isSearching}
                  size="sm"
                  variant="outline"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
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
                        <h4 className="font-medium text-sm">{settlement.name}</h4>
                        {settlement.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            <Activity className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{settlement.memberCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{settlement.location}</span>
                        </div>
                        {settlement.owner && (
                          <div className="flex items-center space-x-1">
                            <Crown className="w-3 h-3" />
                            <span>{settlement.owner}</span>
                          </div>
                        )}
                      </div>
                      {settlement.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{settlement.description}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-4 text-muted-foreground">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No settlements found matching "{searchQuery}"</p>
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