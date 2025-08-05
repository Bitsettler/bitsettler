'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Award, 
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';

interface MemberAnalytics {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  memberGrowthRate: number;
  averageSessionTime: number;
  topContributors: Array<{
    id: string;
    name: string;
    profession: string;
    contributionScore: number;
    projectsCompleted: number;
    joinDate: string;
    lastActive: string;
  }>;
  professionDistribution: Array<{
    profession: string;
    count: number;
    averageLevel: number;
    growthRate: number;
  }>;
  activityTrends: Array<{
    date: string;
    activeMembers: number;
    newJoins: number;
    completedTasks: number;
  }>;
  memberEngagement: {
    highlyActive: number;
    moderatelyActive: number;
    lowActivity: number;
    inactive: number;
  };
}

interface SettlementMetrics {
  treasuryGrowth: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  projectMetrics: {
    completionRate: number;
    averageCompletionTime: number;
    activeProjects: number;
    completedProjects: number;
    totalMaterialsGathered: number;
  };
  settlementLevel: {
    currentLevel: number;
    progressToNext: number;
    experiencePoints: number;
    nextLevelRequirement: number;
  };
}

interface AnalyticsData {
  memberAnalytics: MemberAnalytics;
  settlementMetrics: SettlementMetrics;
  lastUpdated: string;
}

export function SettlementAnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/settlement/analytics?timeRange=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load analytics data');
      }
    } catch (err) {
      setError('Failed to load analytics data');
      // Mock data for development
      setData(getMockAnalyticsData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/settlement/analytics/export?format=${format}&timeRange=${timeRange}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settlement-analytics-${timeRange}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Export failed silently
    }
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Analytics Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Data</CardTitle>
          <CardDescription>Analytics data is not available.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Settlement Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={fetchAnalyticsData} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.memberAnalytics.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              +{data.memberAnalytics.newMembersThisMonth} this month
            </p>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {data.memberAnalytics.memberGrowthRate}% growth
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.memberAnalytics.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((data.memberAnalytics.activeMembers / data.memberAnalytics.totalMembers) * 100)}% active rate
            </p>
            <Progress 
              value={(data.memberAnalytics.activeMembers / data.memberAnalytics.totalMembers) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement Level</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.settlementMetrics.settlementLevel.currentLevel}</div>
            <p className="text-xs text-muted-foreground">
              {data.settlementMetrics.settlementLevel.progressToNext}% to next level
            </p>
            <Progress 
              value={data.settlementMetrics.settlementLevel.progressToNext} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Completion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.settlementMetrics.projectMetrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.settlementMetrics.projectMetrics.completedProjects} completed
            </p>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              {data.settlementMetrics.projectMetrics.averageCompletionTime}d avg
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>Most active settlement members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.memberAnalytics.topContributors.slice(0, 5).map((member, index) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.profession}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="default">{member.contributionScore}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {member.projectsCompleted} projects
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profession Distribution</CardTitle>
            <CardDescription>Member spread across professions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.memberAnalytics.professionDistribution.map((profession) => (
                <div key={profession.profession}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{profession.profession}</span>
                    <span className="text-sm text-muted-foreground">
                      {profession.count} members
                    </span>
                  </div>
                  <Progress 
                    value={(profession.count / data.memberAnalytics.totalMembers) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Avg Level: {profession.averageLevel}</span>
                    <span className="text-green-600">+{profession.growthRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Engagement */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Member Engagement</CardTitle>
            <CardDescription>Activity levels across your settlement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Highly Active</span>
                <Badge variant="default">{data.memberAnalytics.memberEngagement.highlyActive}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Moderately Active</span>
                <Badge variant="secondary">{data.memberAnalytics.memberEngagement.moderatelyActive}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Low Activity</span>
                <Badge variant="outline">{data.memberAnalytics.memberEngagement.lowActivity}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Inactive</span>
                <Badge variant="destructive">{data.memberAnalytics.memberEngagement.inactive}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Visualization Coming Soon</CardTitle>
            <CardDescription>Interactive charts and trends will be added next</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chart.js integration planned for data visualization</p>
              <p className="text-sm mt-2">Export functionality ready for CSV downloads</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-1 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Mock data for development
function getMockAnalyticsData(): AnalyticsData {
  return {
    memberAnalytics: {
      totalMembers: 45,
      activeMembers: 32,
      newMembersThisMonth: 8,
      memberGrowthRate: 15.2,
      averageSessionTime: 145,
      topContributors: [
        {
          id: '1',
          name: 'Alex the Builder',
          profession: 'Construction',
          contributionScore: 1250,
          projectsCompleted: 12,
          joinDate: '2024-01-15',
          lastActive: '2024-02-20'
        },
        {
          id: '2',
          name: 'Sarah Crafter',
          profession: 'Crafting',
          contributionScore: 1180,
          projectsCompleted: 15,
          joinDate: '2024-01-20',
          lastActive: '2024-02-19'
        }
      ],
      professionDistribution: [
        { profession: 'Construction', count: 12, averageLevel: 8.5, growthRate: 5.2 },
        { profession: 'Crafting', count: 10, averageLevel: 7.8, growthRate: 8.1 },
        { profession: 'Gathering', count: 8, averageLevel: 6.2, growthRate: 12.5 },
        { profession: 'Combat', count: 15, averageLevel: 9.1, growthRate: 3.8 }
      ],
      activityTrends: [],
      memberEngagement: {
        highlyActive: 15,
        moderatelyActive: 17,
        lowActivity: 8,
        inactive: 5
      }
    },
    settlementMetrics: {
      treasuryGrowth: [],
      projectMetrics: {
        completionRate: 78,
        averageCompletionTime: 12,
        activeProjects: 8,
        completedProjects: 24,
        totalMaterialsGathered: 15420
      },
      settlementLevel: {
        currentLevel: 7,
        progressToNext: 65,
        experiencePoints: 8750,
        nextLevelRequirement: 10000
      }
    },
    lastUpdated: new Date().toISOString()
  };
} 