'use client';

import { useState } from 'react';
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
  Key
} from 'lucide-react';

interface SettlementOnboardingChoiceProps {
  onJoinSettlement: (inviteCode: string) => void;
  onEstablishSettlement: () => void;
}

export function SettlementOnboardingChoice({ 
  onJoinSettlement, 
  onEstablishSettlement 
}: SettlementOnboardingChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<'join' | 'establish' | null>(null);
  const [inviteCode, setInviteCode] = useState('');

  const handleJoinSubmit = () => {
    if (inviteCode.trim()) {
      onJoinSettlement(inviteCode.trim());
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
        <Card 
          className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
            selectedOption === 'join' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setSelectedOption('join')}
        >
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
        <Card 
          className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
            selectedOption === 'establish' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setSelectedOption('establish')}
        >
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
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Search className="w-4 h-4" />
                <span>Search game settlements</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Import member data</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Setup management system</span>
              </div>
            </div>
            <Button 
              onClick={onEstablishSettlement}
              className="w-full"
              size="lg"
              variant="outline"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Settlements
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