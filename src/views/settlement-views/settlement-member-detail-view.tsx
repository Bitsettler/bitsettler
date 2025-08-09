'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Container } from '@/components/container';
import { useCurrentMember } from '../../hooks/use-current-member';
import { useSkillNames } from '../../hooks/use-skill-names';
import { getSettlementTierBadgeClasses } from '../../lib/settlement/tier-colors';
import { TierIcon } from '@/components/ui/tier-icon';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { getDisplayProfession, getSecondaryProfession, getProfessionSource } from '@/lib/utils/profession-utils';
import { ProfessionSelector } from '@/components/profession-selector';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { 
  User, 
  Calendar, 
  Clock, 
  Activity, 
  TrendingUp, 
  Star, 
  Award, 
  Target, 
  ChevronRight, 
  MapPin,
  ArrowLeft,
  UserCheck,
  UserX,
  Shield,
  Package,
  Hammer,
  Crown,
  Settings,
  Save,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { ContributionDisplay } from '@/components/projects/contribution-display';

/**
 * Convert skill level to tier (0-10 based on Bitcraft progression)
 * 0 = tier 0, 1-10 = tier 1, 11-20 = tier 2, 21-30 = tier 3, 31-40 = tier 4, etc.
 */
function getSkillTier(level: number): number {
  if (level === 0) return 0;
  if (level >= 100) return 10;
  return Math.min(Math.floor(level / 10) + 1, 10);
}

interface MemberDetail {
  id: string;
  name: string;
  entityId: string;
  playerEntityId?: string | null;
  settlement_name: string;
  profession: string;
  primary_profession?: string | null;
  secondary_profession?: string | null;
  top_profession?: string | null;
  totalSkillLevel: number;
  totalXP: number;
  highestLevel: number;
  skills: Record<string, number>;
  permissions: {
    inventory: number;
    build: number;
    officer: number;
    coOwner: number;
  };
  lastLogin: string | null;
  joinedAt: string | null;
  isActive: boolean;
  lastSyncInfo?: string;
}

interface MemberDetailResponse {
  success: boolean;
  data?: MemberDetail;
  error?: string;
  meta?: {
    dataSource: string;
    lastUpdated: string;
    lastSyncInfo?: string;
  };
}

interface MemberContributionItem {
  id: string;
  project_id: string;
  contribution_type: 'Direct' | 'Crafted' | 'Purchased';
  delivery_method: 'Dropbox' | 'Officer Handoff' | 'Added to Building' | 'Other';
  item_name: string | null;
  quantity: number;
  notes: string | null;
  contributed_at: string;
  project?: {
    name: string;
    short_id?: string | null;
    project_number?: number | null;
    status?: string | null;
    priority?: number | null;
  } | null;
}

interface MemberContributionsResponse {
  success: boolean;
  data?: {
    settlementId: string;
    memberId: string;
    contributions: MemberContributionItem[];
    totalCount: number;
  };
  error?: string;
  meta?: {
    generatedAt: string;
  };
}

interface SettlementMemberDetailProps {
  memberId: string;
  hideBackButton?: boolean;
  hideHeader?: boolean;
  hideProfileName?: boolean;
  hideContainer?: boolean;
}

export function SettlementMemberDetailView({ memberId, hideBackButton = false, hideHeader = false, hideProfileName = false, hideContainer = false }: SettlementMemberDetailProps) {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Profession editing state (only for current user)
  const [isEditingProfessions, setIsEditingProfessions] = useState(false);
  const [primaryProfession, setPrimaryProfession] = useState<string | undefined>();
  const [secondaryProfession, setSecondaryProfession] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [contributions, setContributions] = useState<MemberContributionItem[] | null>(null);
  const [contribError, setContribError] = useState<string | null>(null);
  
  const { member: currentMember, isLoading: memberLoading } = useCurrentMember();
  const { getTopSkillsWithNames, loading: skillNamesLoading } = useSkillNames();

  // Check if this is the current user's own profile
  const isOwnProfile = currentMember?.player_entity_id === memberId;

  useEffect(() => {
    // Wait for member data to load before making API calls
    if (memberLoading) return;
    fetchMemberDetails();
    fetchMemberContributions();
  }, [memberId, currentMember, memberLoading]);

  // Initialize profession state when member data loads
  useEffect(() => {
    if (member) {
      setPrimaryProfession(member.primary_profession || undefined);
      setSecondaryProfession(member.secondary_profession || undefined);
    }
  }, [member]);

  const fetchMemberDetails = async () => {
    // Use selectedSettlement or fallback to member's settlement
    const settlementId = currentMember?.settlement_id;
    
    if (!settlementId) {
      setError('No settlement available - please select a settlement or claim a character');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/settlement/members/${encodeURIComponent(memberId)}?settlementId=${encodeURIComponent(settlementId)}`
      );
      
      const result: MemberDetailResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch member details');
      }

      setMember(result.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Member detail fetch failed
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberContributions = async () => {
    const settlementId = currentMember?.settlement_id;
    if (!settlementId) return;
    try {
      setContribError(null);
      const resp = await fetch(`/api/settlement/members/${encodeURIComponent(memberId)}/contributions?settlementId=${encodeURIComponent(settlementId)}`);
      const result: MemberContributionsResponse = await resp.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch contributions');
      setContributions(result.data?.contributions || []);
    } catch (e) {
      setContribError(e instanceof Error ? e.message : 'Failed to fetch contributions');
      setContributions([]);
    }
  };

  const handleBackToMembers = () => {
    window.history.back();
  };

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
    
    setSaving(true);
    setSaveError(null);

    try {
      const result = await api.post('/api/user/update-professions', {
        primaryProfession: primaryProfession || null,
        secondaryProfession: secondaryProfession || null
      });

      if (result.success) {
        // Update the member data locally
        setMember(prev => prev ? {
          ...prev,
          primary_profession: primaryProfession || null,
          secondary_profession: secondaryProfession || null
        } : null);
        
        setIsEditingProfessions(false);
        toast.success('Professions updated successfully');
      } else {
        setSaveError(result.error || 'Failed to update professions');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastSeen = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    const lastSeen = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getPermissionLevel = (permission: number): { label: string; color: string; icon: React.ComponentType<{ className?: string }> } => {
    if (permission >= 1) return { label: 'Granted', color: 'text-foreground bg-accent/50', icon: UserCheck };
    return { label: 'Denied', color: 'text-muted-foreground bg-muted/50', icon: UserX };
  };

  const getMemberRole = (permissions: any): { role: string; description: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (permissions.coOwner >= 1) return { 
      role: 'Co-Owner', 
      description: 'Has full administrative access and can manage all settlement functions',
      variant: 'destructive'
    };
    if (permissions.officer >= 1) return { 
      role: 'Officer', 
      description: 'Has administrative privileges and can manage members and permissions',
      variant: 'default'
    };
    if (permissions.build >= 1) return { 
      role: 'Builder', 
      description: 'Can construct and modify buildings within the settlement',
      variant: 'secondary'
    };
    if (permissions.inventory >= 1) return { 
      role: 'Contributor', 
      description: 'Can access and manage settlement inventory and resources',
      variant: 'outline'
    };
    return { 
      role: 'Member', 
      description: 'Basic member with standard settlement access',
      variant: 'outline'
    };
  };

  // Use skill names hook to get properly named skills
  const topSkills = member ? getTopSkillsWithNames(member.skills, 8) : [];

  if (loading || skillNamesLoading) {
    return (
      <Container className="py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToMembers}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading member details...</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !member) {
    return (
      <Container className="py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToMembers}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-500 mb-2">Error loading member details</p>
              <p className="text-muted-foreground">{error || 'Member not found'}</p>
              <Button variant="outline" onClick={fetchMemberDetails} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  const inventoryPerm = getPermissionLevel(member.permissions.inventory);
  const buildPerm = getPermissionLevel(member.permissions.build);
  const officerPerm = getPermissionLevel(member.permissions.officer);
  const coOwnerPerm = getPermissionLevel(member.permissions.coOwner);

  const content = (
    <div className="space-y-6">
        {/* Back button above cards */}
        {!hideBackButton && (
          <div>
            <Button variant="ghost" size="sm" onClick={handleBackToMembers}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
          </div>
        )}

      {/* Member Profile + Top Skills */}
      <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-end">
            {member.isActive ? (
              <Badge className="bg-green-500">
                <UserCheck className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">
                <UserX className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-bold">
                {member.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold m-0">{member.name}</h2>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={getMemberRole(member.permissions).variant} className="text-xs">
                      {getMemberRole(member.permissions).role}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getMemberRole(member.permissions).description}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Professions */}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{getDisplayProfession(member)}</span>
                <span className="text-muted-foreground">/ {getSecondaryProfession(member) || 'Not set'}</span>
                {getProfessionSource(member) === 'calculated' && (
                  <Badge variant="outline" className="text-xxs uppercase tracking-wide">Auto</Badge>
                )}
                {isOwnProfile && !isEditingProfessions && (
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={handleEditProfessions}>
                    Edit
                  </Button>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Joined {formatDate(member.joinedAt)}</span>
                <span>• Last seen {formatLastSeen(member.lastLogin)}</span>
              </div>

              {/* Permissions (compact iconified chips) */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge className={`${inventoryPerm.color} text-xs inline-flex items-center gap-1`}>
                  <inventoryPerm.icon className="h-3 w-3" />
                  Inventory
                </Badge>
                <Badge className={`${buildPerm.color} text-xs inline-flex items-center gap-1`}>
                  <buildPerm.icon className="h-3 w-3" />
                  Building
                </Badge>
                <Badge className={`${officerPerm.color} text-xs inline-flex items-center gap-1`}>
                  <officerPerm.icon className="h-3 w-3" />
                  Officer
                </Badge>
                <Badge className={`${coOwnerPerm.color} text-xs inline-flex items-center gap-1`}>
                  <coOwnerPerm.icon className="h-3 w-3" />
                  Co-Owner
                </Badge>
              </div>
              
              {/* Profession Editing Section - Only for current user */}
              {isOwnProfile && isEditingProfessions && (
                <div className="space-y-3 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Edit Professions</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveProfessions} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                  {saveError && (
                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                      {saveError}
                    </div>
                  )}
                  <ProfessionSelector
                    primaryProfession={primaryProfession}
                    secondaryProfession={secondaryProfession}
                    onPrimaryChange={setPrimaryProfession}
                    onSecondaryChange={setSecondaryProfession}
                    memberSkills={member.skills}
                    allowNone={true}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top 5 Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSkills.length > 0 ? (
                topSkills.slice(0, 5).map((skill) => (
                  <div key={skill.name} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-sm truncate">{skill.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">Lv {skill.level}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded">
                      <div
                        className={`h-2 rounded transition-all ${getSettlementTierBadgeClasses(getSkillTier(skill.level)).split(' ')[0]}`}
                        style={{ width: `${Math.min(Math.max(skill.level, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No skill data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contributions */}
      <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Contributions
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchMemberContributions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {contribError ? (
            <div className="text-sm text-red-500">{contribError}</div>
          ) : contributions === null ? (
            <div className="text-sm text-muted-foreground">Loading contributions...</div>
          ) : contributions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No contributions yet.</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {contributions.slice(0, 20).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.item_name && (
                          <ContributionDisplay
                            itemName={c.item_name}
                            quantity={c.quantity}
                          />
                        )}
                        {!c.item_name && (
                          <span className="font-medium">{c.quantity} items</span>
                        )}
                        <Badge variant="outline" className="text-xs">{c.delivery_method}</Badge>
                        {c.notes && <span className="text-sm text-muted-foreground">- {c.notes}</span>}
                      </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {c.project ? (
                        <a
                          className="hover:underline"
                          href={`/en/settlement/projects/${encodeURIComponent((c.project.project_number?.toString() ?? c.project_id))}`}
                        >
                          {c.project.name}
                        </a>
                      ) : (
                        <span>Project</span>
                      )}
                      <span className="ml-2">• {new Date(c.contributed_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      </div>

      {/* Advanced Details */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Bitcraft ID</p>
              <p className="font-mono text-sm">{member.playerEntityId || member.entityId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Settlement</p>
              <p className="text-sm">{member.settlement_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">
                  {member.isActive ? 'Recently Active' : 'Inactive'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last seen {formatLastSeen(member.lastLogin)}
                </p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <TooltipProvider>
      {hideContainer ? (
        content
      ) : (
        <Container className="py-6">
          {content}
        </Container>
      )}
    </TooltipProvider>
  );
} 