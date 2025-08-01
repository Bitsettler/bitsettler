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
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
import { useCurrentMember } from '../../hooks/use-current-member';
import { useSkillNames } from '../../hooks/use-skill-names';
import { getSettlementTierBadgeClasses } from '../../lib/settlement/tier-colors';
import { TierIcon } from '@/components/ui/tier-icon';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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
  Crown
} from 'lucide-react';

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
  profession: string;
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

interface SettlementMemberDetailProps {
  memberId: string;
}

export function SettlementMemberDetailView({ memberId }: SettlementMemberDetailProps) {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { selectedSettlement } = useSelectedSettlement();
  const { member: currentMember, isLoading: memberLoading } = useCurrentMember();
  const { getTopSkillsWithNames, loading: skillNamesLoading } = useSkillNames();

  useEffect(() => {
    // Wait for member data to load before making API calls
    if (memberLoading) return;
    fetchMemberDetails();
  }, [memberId, selectedSettlement, currentMember, memberLoading]);

  const fetchMemberDetails = async () => {
    // Use selectedSettlement or fallback to member's settlement
    const settlementId = selectedSettlement?.id || currentMember?.settlement_id;
    
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
      console.error('Member detail fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMembers = () => {
    window.history.back();
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

  return (
    <TooltipProvider>
      <Container className="py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToMembers}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{member.name}</h1>
              <p className="text-muted-foreground">Member details and profile information</p>
            </div>
          </div>
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

      {/* Member Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Member Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-bold">
                {member.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <div className="mt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={getMemberRole(member.permissions).variant} className="text-sm">
                        {getMemberRole(member.permissions).role}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getMemberRole(member.permissions).description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Bitcraft ID</p>
                  <p className="font-mono text-sm">{member.entityId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Settlement</p>
                  <p className="text-sm">{selectedSettlement?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Joined</p>
                  <p className="text-sm">{formatDate(member.joinedAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Last Seen</p>
                  <p className="text-sm">{formatLastSeen(member.lastLogin)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top 5 Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSkills.length > 0 ? (
                topSkills.slice(0, 5).map((skill, index) => (
                          <div key={skill.name} className="space-y-1">
          <div className="flex items-center">
            <span className="font-medium text-sm">{skill.name}</span>
          </div>
                    <div className="relative bg-muted rounded-full h-6">
                      <div 
                        className={`h-6 rounded-full transition-all ${getSettlementTierBadgeClasses(getSkillTier(skill.level)).split(' ')[0]}`}
                        style={{ width: `${(() => {
                          const tier = getSkillTier(skill.level);
                          if (tier === 0) return 0;
                          if (tier === 10) return 100; // Max tier is always full
                          
                          // Calculate progress within current tier (0-9, 10-19, 20-29, 30-39, etc.)
                          const tierStart = (tier - 1) * 10;
                          const tierEnd = tier * 10 - 1;
                          const progressInTier = ((skill.level - tierStart) / (tierEnd - tierStart)) * 100;
                          return Math.min(Math.max(progressInTier, 0), 100);
                        })()}%` }}
                      />
                      <div className="absolute left-2 top-1">
                        <TierIcon tier={getSkillTier(skill.level)} size="sm" variant="game-asset" />
                      </div>
                      <div 
                        className={`absolute top-0 -translate-y-1 inline-flex items-center justify-center w-10 h-8 rounded-lg text-sm font-bold shadow-lg border-2 border-background transition-all ${getSettlementTierBadgeClasses(getSkillTier(skill.level))}`}
                        style={{ left: `${(() => {
                          const tier = getSkillTier(skill.level);
                          if (tier === 0) return 0;
                          if (tier === 10) return 100; // Max tier is always full
                          
                          // Calculate progress within current tier (0-9, 10-19, 20-29, 30-39, etc.)
                          const tierStart = (tier - 1) * 10;
                          const tierEnd = tier * 10 - 1;
                          const progressInTier = ((skill.level - tierStart) / (tierEnd - tierStart)) * 100;
                          const progress = Math.min(Math.max(progressInTier, 0), 100);
                          
                          // Position the badge at the end of the progress as an anchor
                          return Math.max(progress - 5, 0); // Anchor at the tip
                        })()}%` }}
                      >
                        {skill.level}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No skill data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Skill Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12 opacity-50">
            <div className="text-center">
              <div className="text-2xl font-medium text-muted-foreground mb-2">Coming Soon</div>
              <p className="text-sm text-muted-foreground">Enhanced skill analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Settlement Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="font-medium">Inventory</span>
              </div>
              <Badge className={inventoryPerm.color}>
                <inventoryPerm.icon className="h-3 w-3 mr-1" />
                {inventoryPerm.label}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hammer className="h-4 w-4" />
                <span className="font-medium">Building</span>
              </div>
              <Badge className={buildPerm.color}>
                <buildPerm.icon className="h-3 w-3 mr-1" />
                {buildPerm.label}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Officer</span>
              </div>
              <Badge className={officerPerm.color}>
                <officerPerm.icon className="h-3 w-3 mr-1" />
                {officerPerm.label}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span className="font-medium">Co-Owner</span>
              </div>
              <Badge className={coOwnerPerm.color}>
                <coOwnerPerm.icon className="h-3 w-3 mr-1" />
                {coOwnerPerm.label}
              </Badge>
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
            
            <div className="flex items-center gap-3 pb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Joined Settlement</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(member.joinedAt)}
                </p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </Container>
    </TooltipProvider>
  );
} 