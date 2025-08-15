'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, Home, RefreshCw } from 'lucide-react';
import { Container } from '@/components/container';
import { useCurrentMember } from '@/hooks/use-current-member';
import { SettlementMember } from '@/hooks/use-current-member';

interface FormerMemberViewProps {
  member: SettlementMember;
}

export function FormerMemberView({ member }: FormerMemberViewProps) {
  const { refetch } = useCurrentMember();

  const handleRefresh = () => {
    // Refresh member data to check if they've been re-added to settlement
    refetch();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container>
      <div className="flex items-center justify-center min-h-[60vh] py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl">Former Settlement Member</CardTitle>
              <CardDescription className="text-lg">
                You are no longer an active member of this settlement
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Member Info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Character Name</span>
                <span className="font-semibold">{member.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Membership Status</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                  <Users className="w-3 h-3 mr-1" />
                  Former Member
                </Badge>
              </div>

              {member.joined_settlement_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Originally Joined</span>
                  <span className="text-sm">{formatDate(member.joined_settlement_at)}</span>
                </div>
              )}

              {member.last_login_timestamp && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Last Seen In-Game</span>
                  <span className="text-sm">{formatDate(member.last_login_timestamp)}</span>
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <h3 className="font-semibold">What does this mean?</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Your character <strong>{member.name}</strong> is no longer detected as an active member 
                  of this settlement in BitCraft. This typically happens when:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You left the settlement in the game</li>
                  <li>You were removed from the settlement</li>
                  <li>You joined a different settlement</li>
                  <li>Your character is no longer active in BitCraft</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleRefresh}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status Again
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/en'} 
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              <p>
                If you believe this is an error, please check your settlement status in BitCraft 
                or contact your settlement leadership.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
