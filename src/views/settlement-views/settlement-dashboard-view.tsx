'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Container } from '../../components/container';
import { CompactSettlementInviteCode } from '../../components/settlement-invite-code-compact';
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
import { 
  Users, 
  Building, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Settings,
  User,
  Zap,
  Award,
  Target,
  Wallet
} from 'lucide-react';

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalProjects: number;
  completedProjects: number;
  currentBalance: number;
  monthlyIncome: number;
}

interface SkillsInsights {
  totalSkilledMembers: number;
  avgSkillLevel: number;
  topProfession: string;
  totalSkillPoints: number;
  topSkills: Array<{name: string, members: number, avgLevel: number}>;
}

interface DashboardData {
  settlement: any;
  treasury: any;
  stats: DashboardStats;
  skills?: SkillsInsights;
  lastUpdated: string;
}

export function SettlementDashboardView() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { selectedSettlement, inviteCode, regenerateInviteCode, clearSettlement } = useSelectedSettlement();

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Only fetch if we have a selected settlement
      if (!selectedSettlement) {
        setError('No settlement selected');
        return;
      }
      
      const url = `/api/settlement/dashboard?settlementId=${encodeURIComponent(selectedSettlement.id)}`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSettlement]);

  useEffect(() => {
    // Only fetch data if we have a selected settlement
    if (selectedSettlement) {
      fetchDashboardData();
      
      // Refresh data every 5 minutes (less aggressive to prevent blinking)
      const interval = setInterval(fetchDashboardData, 300000);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, selectedSettlement]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatHexcoin = (num: number): string => {
    return `${formatCurrency(num)} 🪙`;
  };

  if (isLoading) {
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
  };

  return (
    <Container>
      <div className="space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settlement Dashboard</h1>
            <p className="text-muted-foreground">Overview of your settlement</p>
          </div>
        <div className="flex items-center gap-3">
          {inviteCode && (
            <CompactSettlementInviteCode 
              inviteCode={inviteCode}
              className="ml-auto"
            />
          )}
        </div>
        </div>

      {/* Settlement Info */}
      {selectedSettlement && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{selectedSettlement.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Tier {selectedSettlement.tier}</span>
                    <span>•</span>
                    <span>{formatNumber(selectedSettlement.population)} members</span>
                    <span>•</span>
                    <span>{formatNumber(selectedSettlement.tiles)} tiles</span>
                  </div>
                </div>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalMembers)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.activeMembers)} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHexcoin(stats.monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Insights */}
      {dashboardData?.skills && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Skills Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Skill Level</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.skills?.avgSkillLevel || 0}</div>
                <p className="text-xs text-muted-foreground">Settlement average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Profession</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{dashboardData.skills?.topProfession || 'Unknown'}</div>
                <p className="text-xs text-muted-foreground">Most common</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Skills Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4" />
                  Top Skills by Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.skills?.topSkills?.slice(0, 5).map((skill, index) => {
                    const maxMembers = dashboardData.skills?.topSkills?.[0]?.members || 1;
                    const percentage = (skill.members / maxMembers) * 100;
                    
                    return (
                      <div key={skill.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{skill.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span>{skill.members} members</span>
                            <span className="font-medium">Lvl {skill.avgLevel}</span>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Activity & Live Feed */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Settlement Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Recent activities will appear here when settlement data is connected.
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
    </Container>
  );
} 