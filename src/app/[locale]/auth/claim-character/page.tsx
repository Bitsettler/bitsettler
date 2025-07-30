'use client';

import { useSession } from '@/hooks/use-auth';
import { CharacterClaiming } from '../../../../components/auth/character-claiming';
import { Container } from '../../../../components/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ClaimCharacterPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must be signed in to claim a character.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return <CharacterClaiming />;
} 