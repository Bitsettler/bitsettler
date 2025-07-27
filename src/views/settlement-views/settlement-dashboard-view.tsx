'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';

interface SettlementData {
  settlement: {
    settlementInfo: any;
    stats: {
      totalMembers: number;
      activeMembers: number;
      totalProjects: number;
      activeProjects: number;
      completedProjects: number;
    };
    recentMembers: any[];
    topProfessions: Array<{
      profession: string;
      count: number;
      members: any[];
    }>;
  };
  treasury: {
    summary: {
      currentBalance: number;
      totalIncome: number;
      totalExpenses: number;
    } | null;
    stats: {
      monthlyIncome: number;
      monthlyExpenses: number;
      netChange: number;
      transactionCount: number;
    };
    recentTransactions: any[];
  };
}

export function SettlementDashboardView() {
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/settlement/dashboard');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch dashboard data');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settlement features may be disabled if Supabase is not configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>No settlement data found.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settlement Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.settlement.stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {data.settlement.stats.activeMembers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.settlement.stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {data.settlement.stats.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.treasury.summary?.currentBalance?.toLocaleString() || '0'} ₡
            </div>
            <p className="text-xs text-muted-foreground">
              Net: {data.treasury.stats.netChange >= 0 ? '+' : ''}
              {data.treasury.stats.netChange.toLocaleString()} ₡
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.treasury.stats.transactionCount}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Professions */}
      <Card>
        <CardHeader>
          <CardTitle>Top Professions</CardTitle>
          <CardDescription>Most common professions in your settlement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.settlement.topProfessions.slice(0, 5).map((profession, index) => (
              <div key={profession.profession} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-medium">{profession.profession}</span>
                </div>
                <Badge>{profession.count} members</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
            <CardDescription>Latest member activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.settlement.recentMembers.slice(0, 5).map((member: any) => (
                <div key={member.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{member.name}</span>
                  <Badge variant="secondary">{member.profession}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest treasury activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.treasury.recentTransactions.slice(0, 5).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate">{transaction.description}</span>
                  <Badge variant={transaction.transactionType === 'Income' ? 'default' : 'destructive'}>
                    {transaction.transactionType === 'Income' ? '+' : '-'}
                    {Math.abs(transaction.amount).toLocaleString()} ₡
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 