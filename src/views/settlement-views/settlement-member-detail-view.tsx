'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/container';
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
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
  ArrowLeft
} from 'lucide-react';

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

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId, selectedSettlement]);

  const fetchMemberDetails = async () => {
    if (!selectedSettlement) {
      setError('No settlement selected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/settlement/members/${encodeURIComponent(memberId)}?settlementId=${encodeURIComponent(selectedSettlement.id)}`
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

  const getPermissionLevel = (permission: number): { label: string; color: string; icon: any } => {
    if (permission >= 1) return { label: 'Yes', color: 'text-green-600 bg-green-50 border-green-200', icon: UserCheck };
    return { label: 'No', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: UserX };
  };

  const getTopSkills = (skills: Record<string, number>): Array<{ name: string; level: number }> => {
    return Object.entries(skills)
      .map(([name, level]) => ({ name, level }))
      .sort((a, b) => b.level - a.level)
      .slice(0, 8);
  };

  if (loading) {
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
  
  const topSkills = getTopSkills(member.skills);

  return (
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
              <h1 className="text-3xl font-bold">Member Details</h1>
              <p className="text-muted-foreground">Detailed information about {member.name}</p>
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
                <p className="text-lg text-muted-foreground">{member.profession}</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Entity ID</p>
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
              <TrendingUp className="h-5 w-5" />
              Skill Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{member.totalSkillLevel}</div>
                <div className="text-sm text-muted-foreground">Total Skill Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{member.highestLevel}</div>
                <div className="text-sm text-muted-foreground">Highest Skill</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{member.totalXP.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{Object.keys(member.skills).length}</div>
                <div className="text-sm text-muted-foreground">Skills Learned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSkills.length > 0 ? (
                topSkills.map((skill, index) => (
                  <div key={skill.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-muted rounded-full h-2 w-20">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${Math.min((skill.level / member.highestLevel) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm w-8 text-right">{skill.level}</span>
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
  );
} 