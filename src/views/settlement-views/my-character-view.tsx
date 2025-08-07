'use client';

import { useCurrentMember } from '../../hooks/use-current-member';
import { SettlementMemberDetailView } from './settlement-member-detail-view';
import { Container } from '@/components/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, User, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function MyCharacterView() {
  const { member, isLoading, isClaimed } = useCurrentMember();
  const router = useRouter();

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading your character...</p>
          </div>
        </div>
      </Container>
    );
  }

  // If user hasn't claimed a character, show claim prompt
  if (!isClaimed || !member) {
    return (
      <Container>
        <div className="max-w-2xl mx-auto py-12">
          <Card>
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <CardTitle>No Character Found</CardTitle>
              <CardDescription>
                You need to claim your settlement character to view your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push('/en/auth/claim-character')} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Claim Your Character
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  // If user has claimed a character, show their member detail
  return (
    <SettlementMemberDetailView 
      memberId={member.player_entity_id} 
      hideBackButton={true} 
      hideHeader={true} 
      hideProfileName={true}
      hideContainer={true} 
    />
  );
}