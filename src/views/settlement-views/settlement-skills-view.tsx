'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Container } from '@/components/container';
import { Award, TrendingUp, Users, Target, RefreshCw, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
import { useCurrentMember } from '../../hooks/use-current-member';

interface CitizenSkills {
  name: string;
  entityId: string;
  profession: string;
  totalSkillLevel: number;
  totalXP: number;
  highestLevel: number;
  skills: Record<string, number>;
  isActive: boolean;
}

interface SkillsAnalytics {
  totalSkills: number;
  averageLevel: number;
  topProfession: string;
  totalSkillPoints: number;
  professionDistribution: Array<{
    profession: string;
    members: number;
    avgLevel: number;
    maxLevel: number;
  }>;
  topSkills: Array<{
    name: string;
    totalMembers: number;
    averageLevel: number;
    maxLevel: number;
  }>;
  skillLevelDistribution: Array<{
    levelRange: string;
    count: number;
  }>;
}

interface SkillsResponse {
  success: boolean;
  data?: SkillsAnalytics;
  error?: string;
  meta?: {
    totalMembers: number;
    dataSource: string;
    generatedAt: string;
  };
}

interface MembersResponse {
  success: boolean;
  data?: CitizenSkills[];
  error?: string;
}

type SortDirection = 'asc' | 'desc' | null;



export function SettlementSkillsView() {
  const [skillsData, setSkillsData] = useState<SkillsAnalytics | null>(null);
  const [citizensData, setCitizensData] = useState<CitizenSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SkillsResponse['meta'] | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { selectedSettlement } = useSelectedSettlement();
  const { member, isLoading: memberLoading } = useCurrentMember();

  useEffect(() => {
    // Wait for member data to load before making API calls
    if (memberLoading) return;
    fetchSkillsData();
  }, [selectedSettlement, member, memberLoading]);

  const fetchSkillsData = async () => {
    // Use selectedSettlement or fallback to member's settlement
    const settlementId = selectedSettlement?.id || member?.settlement_id;
    const settlementName = selectedSettlement?.name || 'Current Settlement';
    
    // Don't fetch data if no settlement is available
    if (!settlementId) {
      console.log('🔍 No settlement available, skipping data fetch', {
        selectedSettlement: selectedSettlement?.id,
        memberSettlement: member?.settlement_id,
        memberLoading
      });
      setLoading(false);
      setCitizensData([]);
      setSkillsData(null);
      setMeta(null);
      setError('No settlement available - please select a settlement or claim a character');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('settlementId', settlementId);

      // Prepare members params with high limit to show all members
      const membersParams = new URLSearchParams();
      membersParams.append('settlementId', settlementId);
      membersParams.append('limit', '500'); // High limit to show all members
      membersParams.append('includeInactive', 'true'); // Include all members

  

      // Fetch both analytics and detailed member data
      const [analyticsResponse, membersResponse] = await Promise.all([
        fetch(`/api/settlement/skills?${params}`),
        fetch(`/api/settlement/members?${membersParams}`)
      ]);

      const analyticsResult: SkillsResponse = await analyticsResponse.json();
      const membersResult: MembersResponse = await membersResponse.json();

      if (!analyticsResult.success) {
        throw new Error(analyticsResult.error || 'Failed to fetch skills analytics');
      }

      if (!membersResult.success) {
        throw new Error(membersResult.error || 'Failed to fetch member data');
      }

      setSkillsData(analyticsResult.data || null);
      const rawMembers = membersResult.data?.members || [];
      
      // Map API data to CitizenSkills interface
      const memberData: CitizenSkills[] = rawMembers.map((member: any) => ({
        name: member.name || 'Unknown Player',
        entityId: member.entity_id || member.id,
        profession: member.top_profession || 'Unknown',
        totalSkillLevel: member.total_level || 0,
        totalXP: member.total_xp || 0,
        highestLevel: member.highest_level || 0,
        skills: member.skills || {},
        isActive: member.is_active || false
      }));
      
      console.log(`🎓 Skills View - Mapped ${memberData.length} members`);
      
      setCitizensData(memberData);
      setMeta(analyticsResult.meta || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Skills fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  // Get all unique skills across all citizens
  const allSkills = Array.from(
    new Set(
      (Array.isArray(citizensData) ? citizensData : []).flatMap(citizen => Object.keys(citizen.skills || {}))
    )
  ).sort();
  
  // Debug logging
  console.log(`🎯 Skills Matrix - Found ${allSkills.length} unique skills for ${(Array.isArray(citizensData) ? citizensData : []).length} members`);

  // Sorting logic
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCitizens = [...(Array.isArray(citizensData) ? citizensData : [])].sort((a, b) => {
    if (!sortDirection) return 0;

    let aValue: any, bValue: any;

    if (sortField === 'name') {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (sortField === 'profession') {
      aValue = a.profession.toLowerCase();
      bValue = b.profession.toLowerCase();
    } else if (sortField === 'totalSkillLevel') {
      aValue = a.totalSkillLevel;
      bValue = b.totalSkillLevel;
    } else if (allSkills.includes(sortField)) {
      aValue = a.skills[sortField] || 0;
      bValue = b.skills[sortField] || 0;
    } else {
      return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-3 w-3" />;
    if (sortDirection === 'desc') return <ArrowDown className="h-3 w-3" />;
    return <ArrowUpDown className="h-3 w-3 opacity-50" />;
  };

  if (loading) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Skills Overview</h1>
            <p className="text-muted-foreground text-sm">
              Track member skills, progression, and settlement capabilities across all professions.
            </p>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading skills data...</p>
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Skills Overview</h1>
            <p className="text-muted-foreground text-sm">
              Track member skills, progression, and settlement capabilities across all professions.
            </p>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500 font-medium">Error loading skills data</p>
                <p className="text-muted-foreground text-sm mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchSkillsData} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Skills Overview</h1>
              <p className="text-muted-foreground text-sm">
                Track member skills, progression, and settlement capabilities across all professions.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </Button>
          </div>

          {/* Loading Analytics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={`loading-card-${i}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading Skills Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-9 w-24 bg-muted rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Loading settlement member data...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fetching skills and member information from the game database
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Skills Overview</h1>
            <p className="text-muted-foreground text-sm">
              Track member skills, progression, and settlement capabilities across all professions.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSkillsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

      {/* High-level Analytics */}
      {skillsData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(meta?.totalMembers || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber((Array.isArray(citizensData) ? citizensData : []).filter(c => c.totalSkillLevel > 0).length)} with skills
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Profession</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{skillsData.topProfession}</div>
              <p className="text-xs text-muted-foreground">Most common specialty</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Level</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{skillsData.averageLevel.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Across all skills</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(skillsData.totalSkillPoints)}</div>
              <p className="text-xs text-muted-foreground">Combined experience</p>
            </CardContent>
          </Card>
        </div>
      )}



      {/* Citizens Skills Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Citizen Skills Matrix</CardTitle>
          <CardDescription>
            Click column headers to sort by skill level.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 border-r w-48">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-auto p-2 font-medium hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <span>Citizen</span>
                        {renderSortIcon('name')}
                      </div>
                    </Button>
                  </TableHead>
                  {allSkills.map((skill) => (
                    <TableHead key={skill} className="text-center min-w-[100px] p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(skill)}
                        className="h-auto p-2 font-medium text-xs hover:bg-muted"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">{skill}</span>
                          {renderSortIcon(skill)}
                        </div>
                      </Button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCitizens.map((citizen, index) => {
                  const citizenKey = citizen.entityId || `citizen-${index}`;
                  return (
                    <TableRow key={citizenKey}>
                      <TableCell className="sticky left-0 bg-background z-10 border-r font-medium p-3">
                        <div className="truncate">
                          <div className="font-medium text-sm">{citizen.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{citizen.profession}</div>
                        </div>
                      </TableCell>
                      {allSkills.map((skill) => {
                        const level = citizen.skills[skill] || 0;
                        return (
                          <TableCell key={`${citizenKey}-${skill}`} className="text-center p-2">
                          {level > 0 ? (
                            <span className="text-sm font-medium">
                              {level}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        );
                      })}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
          
          {(Array.isArray(citizensData) ? citizensData : []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No citizen skill data available</p>
              <p className="text-sm">Data may still be syncing from the game</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </Container>
  );
} 