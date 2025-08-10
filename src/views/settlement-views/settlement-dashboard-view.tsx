'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';


import { Container } from '@/components/container';
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
import { useCurrentMember } from '../../hooks/use-current-member';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  Coins, 
  Activity,
  Wallet,

} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TierIcon } from '@/components/ui/tier-icon';
import { ContributionDisplay } from '@/components/projects/contribution-display';
import { CompactSettlementInviteCode } from '../../components/settlement-invite-code-compact';
import { SettlementDiscordLink } from '../../components/settlement-discord-link';


interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalProjects: number;
  completedProjects: number;
  currentBalance: number;
  monthlyIncome: number;
  tiles?: number;
  supplies?: number;
}

interface SkillsInsights {
  totalSkilledMembers: number;
  avgSkillLevel: number;
  topProfession: string;
  totalSkillPoints: number;
  topSkills: Array<{name: string, members: number, avgLevel: number}>;
}

interface Settlement {
  settlementInfo?: {
    id: string;
    name: string;
    tier: number;
    region?: string;
    treasury?: number;
    supplies?: number;
    tiles?: number;
    population?: number;
  };
  stats?: DashboardStats;
}

interface Treasury {
  summary?: {
    currentBalance: number;
  };
}

interface DashboardData {
  settlement?: Settlement;
  treasury?: Treasury;
  stats: DashboardStats;
  skills?: SkillsInsights;
  meta?: {
    dataSource: string;
    liveDataAvailable: boolean;
    lastUpdated: string;
  };
  lastUpdated: string;
}

export function SettlementDashboardView() {
  const { member } = useCurrentMember();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState<string>('');
  const [settlementActivities, setSettlementActivities] = useState<any[]>([]);
  const [memberActivities, setMemberActivities] = useState<any[]>([]);

  
  const { inviteCode, regenerateInviteCode, isLoading: settlementLoading, generateInviteCodeForSettlement } = useSelectedSettlement();
  

  useEffect(() => {
    if (!settlementLoading && !inviteCode && member?.settlement_id && dashboardData?.settlement?.settlementInfo) {
      const settlementInfo = dashboardData.settlement.settlementInfo;
      generateInviteCodeForSettlement(member.settlement_id, settlementInfo.name).catch(error => {
      });
    }
  }, [settlementLoading, inviteCode, member?.settlement_id, dashboardData?.settlement?.settlementInfo?.name, generateInviteCodeForSettlement]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      const settlementId = member?.settlement_id;
      
      if (!settlementId) {
        setError('No settlement available');
        return;
      }
      
      const url = `/api/settlement/dashboard?settlementId=${encodeURIComponent(settlementId)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [member]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const settlementId = member?.settlement_id;
      if (!settlementId) return;
      
      const settlementResponse = await fetch(`/api/settlement/activities?settlementId=${encodeURIComponent(settlementId)}&limit=10`);
      const settlementData = await settlementResponse.json();
      
      const memberResponse = await fetch(`/api/settlement/member-activities?settlementId=${encodeURIComponent(settlementId)}&limit=10`);
      const memberData = await memberResponse.json();
      
      if (settlementData.success) {
        setSettlementActivities(settlementData.activities);
      }
      
      if (memberData.success) {
        setMemberActivities(memberData.activities);
      }
    } catch (error) {
    }
  }, [member]);



  useEffect(() => {
    const settlementId = member?.settlement_id;
    if (settlementId) {
      fetchDashboardData();
      fetchRecentActivities();

      const interval = setInterval(() => {
        fetchDashboardData();
        fetchRecentActivities();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, fetchRecentActivities, member]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && member?.settlement_id) {
        fetchDashboardData();
        fetchRecentActivities();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchDashboardData, fetchRecentActivities, member]);

  useEffect(() => {
    if (!dashboardData?.meta?.lastUpdated) return;

    const updateCountdown = () => {
      const lastUpdate = new Date(dashboardData.meta!.lastUpdated);
      const nextUpdate = new Date(lastUpdate.getTime() + 5 * 60 * 1000); // 5 minutes later
      const now = new Date();
      const timeLeft = nextUpdate.getTime() - now.getTime();

      if (timeLeft <= 0) {
        setNextUpdateCountdown('Updating...');
        return;
      }

      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      setNextUpdateCountdown(`${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [dashboardData?.meta?.lastUpdated]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatHexcoin = (num: number): string => {
    return `${formatCurrency(num)} 🪙`;
  };

  if (isLoading && !dashboardData) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-500 mb-2">Error loading dashboard</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  const stats = dashboardData?.stats || {
    totalMembers: 0,
    activeMembers: 0,
    totalProjects: 0,
    completedProjects: 0,
    currentBalance: 0,
    monthlyIncome: 0,
    tiles: 0,
    supplies: 0,
  };


  const settlementInfo = dashboardData?.settlement?.settlementInfo;

  return (
    <Container>
      <div className="space-y-6 py-8">

        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settlement Overview</h1>
            <p className="text-muted-foreground">An overview of your settlement with stats and graphs.</p>
          </div>
        </div>

      {/* Settlement Info - Enhanced with Live Data */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4">
                <TierIcon tier={settlementInfo?.tier || 1} size="lg" variant="brico-style" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {settlementInfo?.name || 'Settlement Dashboard'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tier {settlementInfo?.tier || 1} Settlement
                    {dashboardData?.settlement?.masterData?.region_name && (
                      <span> • {dashboardData.settlement.masterData.region_name}</span>
                    )}
                  </p>
                  {settlementInfo?.id && (
                    <div className="mt-3">
                      <SettlementDiscordLink 
                        settlementId={settlementInfo.id}
                        variant="default"
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
            <div className="flex flex-col items-end gap-2">
              {!settlementLoading && inviteCode ? (
                <CompactSettlementInviteCode 
                  inviteCode={inviteCode}
                  onRegenerate={regenerateInviteCode}
                />
              ) : !settlementLoading ? (
                <div className="text-xs text-muted-foreground">
                  No invite code available
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Loading invite code...
                </div>
              )}
              {dashboardData?.meta?.lastUpdated && (
                <div className="text-right">
                  <div className="text-sm font-medium">
                    Updated {new Date(dashboardData.meta.lastUpdated).toLocaleTimeString()}
                  </div>
                  {nextUpdateCountdown && (
                    <div className="text-xs text-muted-foreground">
                      Next update in: {nextUpdateCountdown}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Enhanced Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{formatNumber(stats.totalMembers)}</div>
            <p className="text-xs text-muted-foreground mb-2">
              {stats.totalMembers > 0 ? Math.round((stats.recentlyActiveMembers / stats.totalMembers) * 100) : 0}% active in the last 7 days
            </p>
            <Progress 
              value={stats.totalMembers > 0 ? (stats.recentlyActiveMembers / stats.totalMembers) * 100 : 0} 
              className="h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalProjects)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.completedProjects)} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treasury</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHexcoin(stats.currentBalance)}</div>
            <p className="text-xs text-muted-foreground">Current balance</p>
          </CardContent>
        </Card>

        {/* Live Data Cards */}
        {(stats.tiles !== undefined && stats.tiles > 0) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.tiles)}</div>
              <p className="text-xs text-muted-foreground">Total tiles</p>
            </CardContent>
          </Card>
        )}

        {(stats.supplies !== undefined && stats.supplies > 0) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Supplies</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.supplies)}</div>
              <p className="text-xs text-muted-foreground">Available supplies</p>
            </CardContent>
          </Card>
        )}
      </div>



      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Settlement Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settlementActivities.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {settlementActivities.map((activity: any) => {
                  const isProjectActivity = ['project_contribution', 'project_created', 'project_completed'].includes(activity.activity_type);
                  const projectId = activity.activity_data?.projectId;
                  
                  const isContribution = !!activity.activity_data?.contributionDetails?.itemName;
                  const ActivityContent = (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {activity.activity_data.memberName}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {activity.activity_data.description}
                        </div>
                        {isContribution && (
                          <div className="mt-2 flex items-center gap-3">
                            <ContributionDisplay
                              itemName={activity.activity_data.contributionDetails.itemName}
                              quantity={activity.activity_data.contributionDetails.quantity}
                            />
                            {activity.activity_data.contributionDetails.deliveryMethod && (
                              <Badge variant="outline" className="text-xs">
                                {activity.activity_data.contributionDetails.deliveryMethod}
                              </Badge>
                            )}
                          </div>
                        )}
                        {/* Project name already appears in description; avoid redundant second line */}
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  );

                  if (isProjectActivity && projectId) {
                    return (
                      <a 
                        key={activity.id}
                        href={`/en/settlement/projects/${projectId}`}
                        className="block hover:bg-muted/30 rounded-lg transition-colors"
                      >
                        {ActivityContent}
                      </a>
                    );
                  } else {
                    return (
                      <div key={activity.id}>
                        {ActivityContent}
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-lg font-medium text-muted-foreground mb-2">No Recent Activity</div>
                <p className="text-sm text-muted-foreground">
                  Project contributions will appear here as members contribute to settlement projects.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Member Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memberActivities.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {memberActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="text-lg" title={activity.activity_data.skillName}>
                        {activity.activity_data.icon || '⬆️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {activity.activity_data.memberName}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {activity.activity_data.skillName} Level {activity.activity_data.newLevel}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-lg font-medium text-muted-foreground mb-2">No Recent Activity</div>
                <p className="text-sm text-muted-foreground">
                  Member skill level-ups will appear here once tracking begins.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </Container>
  );
} 