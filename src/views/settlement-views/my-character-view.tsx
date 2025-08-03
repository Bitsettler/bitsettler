'use client';

import { useCurrentMember } from '../../hooks/use-current-member';
import { SettlementMemberDetailView } from './settlement-member-detail-view';
import { Container } from '@/components/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, User, UserPlus, Settings, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProfessionSelector } from '../../components/profession-selector';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

export function MyCharacterView() {
  const { member, isLoading, isClaimed } = useCurrentMember();
  const router = useRouter();
  
  // Profession editing state
  const [isEditingProfessions, setIsEditingProfessions] = useState(false);
  const [primaryProfession, setPrimaryProfession] = useState<string | undefined>();
  const [secondaryProfession, setSecondaryProfession] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize profession state when member data loads
  useEffect(() => {
    if (member) {
      setPrimaryProfession(member.primary_profession || undefined);
      setSecondaryProfession(member.secondary_profession || undefined);
    }
  }, [member]);

  const handleEditProfessions = () => {
    setIsEditingProfessions(true);
    setSaveError(null);
  };

  const handleCancelEdit = () => {
    setIsEditingProfessions(false);
    setSaveError(null);
    // Reset to original values
    setPrimaryProfession(member?.primary_profession || undefined);
    setSecondaryProfession(member?.secondary_profession || undefined);
  };

  const handleSaveProfessions = async () => {
    if (!member) return;

    try {
      setSaving(true);
      setSaveError(null);

      const result = await api.put('/api/settlement/update-professions', {
        primaryProfession: primaryProfession || null,
        secondaryProfession: secondaryProfession || null
      });

      if (result.success) {
        setIsEditingProfessions(false);
        // Refresh member data
        window.location.reload();
      } else {
        throw new Error(result.error || 'Failed to update professions');
      }
    } catch (err) {
      console.error('Failed to update professions:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to update professions');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading your character...</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // If user hasn't claimed a character yet
  if (!isClaimed || !member) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Character</h1>
              <p className="text-muted-foreground">View and manage your character profile</p>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-muted rounded-full">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                No Character Claimed
              </CardTitle>
              <CardDescription>
                You haven't claimed a character yet. To view your character profile, you need to claim a character first.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Characters can be claimed when you join a settlement or if you have unclaimed characters available.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/settlement')} variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button onClick={() => router.push('/auth/claim-character')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Claim Character
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  // If user has claimed a character, show their member detail
  return (
    <Container>
      <div className="space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{member.name}</h1>
            <p className="text-muted-foreground">Your character profile and details</p>
          </div>
        </div>

        {/* Profession Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Profession Settings
                </CardTitle>
                <CardDescription>
                  Manage your primary and secondary professions to represent your playstyle
                </CardDescription>
              </div>
              {!isEditingProfessions && (
                <Button onClick={handleEditProfessions} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Professions
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {saveError && (
              <div className="mb-4 p-3 border border-destructive rounded-md bg-destructive/10">
                <p className="text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {saveError}
                </p>
              </div>
            )}

            {!isEditingProfessions ? (
              /* Display current professions */
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Primary Profession</h4>
                    <div className="text-lg">
                      {member.primary_profession || member.top_profession || 'Not set'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Secondary Profession</h4>
                    <div className="text-lg">
                      {member.secondary_profession || 'Not set'}
                    </div>
                  </div>
                </div>
                {!member.primary_profession && !member.secondary_profession && (
                  <p className="text-sm text-muted-foreground">
                    You haven't set custom professions yet. Click "Edit Professions" to define your specializations.
                  </p>
                )}
              </div>
            ) : (
              /* Profession editing interface */
              <div className="space-y-6">
                <ProfessionSelector
                  primaryProfession={primaryProfession}
                  secondaryProfession={secondaryProfession}
                  onPrimaryChange={setPrimaryProfession}
                  onSecondaryChange={setSecondaryProfession}
                  allowNone={true}
                />
                
                <div className="flex items-center justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfessions}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Professions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Render the member detail view with custom styling */}
        <SettlementMemberDetailView 
          memberId={member.entity_id} 
          hideBackButton={true} 
          hideHeader={true} 
          hideProfileName={true}
          hideContainer={true} 
        />
      </div>
    </Container>
  );
}