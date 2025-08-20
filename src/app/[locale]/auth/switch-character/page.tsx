'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-auth';
import { useClaimPlayer } from '@/hooks/use-claim-player';
import { Container } from '../../../../components/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { SettlementSwitchFlow } from '../../../../components/settlement-switch-flow';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SwitchCharacterPage() {
  const { data: session, status } = useSession();
  const { member, isLoading: memberLoading, isClaimed } = useClaimPlayer();
  const router = useRouter();

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/en/auth/signin');
    }
  }, [status, router]);

  const handleBack = () => {
    // Go back to settlement dashboard
    router.push('/en/settlement');
  };

  const handleComplete = () => {
    // Force refresh to update member data and redirect to dashboard
    window.location.href = '/en/settlement';
  };

  // Loading state
  if (status === 'loading' || memberLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">
              {status === 'loading' ? 'Checking authentication...' : 'Loading character data...'}
            </p>
          </div>
        </div>
      </Container>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <Container>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must be signed in to switch characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/en/auth/signin">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // User has no claimed character
  if (!isClaimed || !member) {
    return (
      <Container>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle>No Character to Switch</CardTitle>
            <CardDescription>
              You must have a claimed character before you can switch to a different one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Join a settlement first to claim your initial character.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleBack}>
                Go to Dashboard
              </Button>
              <Button onClick={() => router.push('/en/settlement')}>
                Join Settlement
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // User has a character - show switch flow
  return (
    <Container>
      <SettlementSwitchFlow
        onBack={handleBack}
        onComplete={handleComplete}
      />
    </Container>
  );
}