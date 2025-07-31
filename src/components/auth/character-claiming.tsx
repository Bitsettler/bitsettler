'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Container } from '../container';
import { Loader2, User, CheckCircle } from 'lucide-react';

interface SettlementMember {
  id: string;
  entity_id: string;
  name: string;
  top_profession: string;
  total_level: number;
  highest_level: number;
  settlement_id: string;
  is_active: boolean;
}

export function CharacterClaiming() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<SettlementMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnclaimedMembers();
  }, []);

  const fetchUnclaimedMembers = async () => {
    try {
      setLoading(true);
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

  const claimCharacter = async (member: SettlementMember, displayName?: string) => {
    if (!session?.user?.id) {
      setError('Must be signed in to claim a character');
      return;
    }

    try {
      setClaiming(member.id);
      setError(null);

      const result = await api.post('/api/settlement/claim-character', {
        characterId: member.entity_id,
        settlementId: member.settlement_id
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

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading available characters...</p>
          </div>
        </div>
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

  return (
    <Container>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Claim Your Character</h1>
          <p className="text-muted-foreground">
            Select your in-game character to link it with your account
          </p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
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
                      {member.top_profession || 'Unknown'}
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
                  onClick={() => claimCharacter(member, customDisplayName.trim() || undefined)}
                  disabled={claiming === member.id}
                  className="w-full"
                >
                  {claiming === member.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Claim This Character
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  );
} 