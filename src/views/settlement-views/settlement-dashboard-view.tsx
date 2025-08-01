'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/container';
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
import { useCurrentMember } from '../../hooks/use-current-member';
import { useSession } from '../../hooks/use-auth';
import { SettlementOnboardingView } from './settlement-onboarding-view';
import { useCallback } from 'react';
import { 
  Users, 
  Package, 
  Coins, 
  Calendar,
  Activity,
  Wallet,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SettlementTierIcon } from '@/components/ui/tier-icon';
import { CompactSettlementInviteCode } from '../../components/settlement-invite-code-compact';


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
  // ✅ ALL HOOKS MUST BE AT THE TOP - Rules of Hooks
  const { data: session, status } = useSession();
  const { member, isLoading: memberLoading, isClaimed } = useCurrentMember();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState<string>('');
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  
  const { selectedSettlement, inviteCode, regenerateInviteCode, clearSettlement } = useSelectedSettlement();

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use selectedSettlement or fall back to member's settlement
      const settlementId = selectedSettlement?.id || member?.settlement_id;
      
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
  }, [selectedSettlement, member]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const settlementId = selectedSettlement?.id || member?.settlement_id;
      if (!settlementId) return;
      
      const response = await fetch(`/api/settlement/recent-activities?settlementId=${encodeURIComponent(settlementId)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setRecentActivities(data.activities);
      }
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  }, [selectedSettlement, member]);

  useEffect(() => {
    // Fetch data if we have a selected settlement or member with settlement
    const settlementId = selectedSettlement?.id || member?.settlement_id;
    if (settlementId) {
      fetchDashboardData();
      fetchRecentActivities();
      
      // Refresh data every 5 minutes (300 seconds)
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchRecentActivities();
      }, 300000);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, fetchRecentActivities, selectedSettlement, member]);

  // Countdown timer for next update
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

  // ✅ UTILITY FUNCTIONS (non-hooks)
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatHexcoin = (num: number): string => {
    return `${formatCurrency(num)} 🪙`;
  };

  // ✅ CONDITIONAL RENDERING - After all hooks are called
  // Note: Auth protection is now handled by AuthGuard in layout
  // This component only handles data loading states

  // ⚠️ ONLY show loading if we don't have any data yet
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

    // Get live settlement info if available  
  const settlementInfo = dashboardData?.settlement?.settlementInfo;
  const isLiveData = dashboardData?.meta?.liveDataAvailable || false;





  return (
    <Container>
      <div className="space-y-6 py-8">

        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settlement Overview</h1>
            <p className="text-muted-foreground">Dashboard and management tools</p>
          </div>
          <div></div>
        </div>

      {/* Settlement Info - Enhanced with Live Data */}
      {(selectedSettlement || settlementInfo) && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">
                    {settlementInfo?.name || selectedSettlement?.name}
                  </h2>
                  <SettlementTierIcon tier={settlementInfo?.tier || selectedSettlement?.tier || 1} />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Tier {settlementInfo?.tier || selectedSettlement?.tier || 1} Settlement
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {inviteCode && (
                  <CompactSettlementInviteCode 
                    inviteCode={inviteCode}
                    onRegenerate={regenerateInviteCode}
                  />
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
      )}



      {/* Enhanced Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalMembers)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.activeMembers)} active in the last 7 days
            </p>
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
            <div className="text-center py-8">
              <div className="text-lg font-medium text-muted-foreground mb-2">Coming Soon</div>
              <p className="text-sm text-muted-foreground">
                Settlement event logs and activity feed will be displayed here in a future update.
              </p>
            </div>
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
            {recentActivities.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentActivities.map((activity: any) => (
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