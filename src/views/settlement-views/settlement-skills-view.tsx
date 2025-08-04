'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Container } from '@/components/container';
import { Award, TrendingUp, Users, Target, RefreshCw, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
import { useCurrentMember } from '../../hooks/use-current-member';
import { useSkillNames } from '../../hooks/use-skill-names';
import { getSettlementTierBadgeClasses } from '../../lib/settlement/tier-colors';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TierIcon } from '@/components/ui/tier-icon';

/**
 * Convert skill level to tier (0-10 based on Bitcraft progression)
 * 0 = tier 0, 1-10 = tier 1, 11-20 = tier 2, 21-30 = tier 3, 31-40 = tier 4, etc.
 */
function getSkillTier(level: number): number {
  if (level === 0) return 0;
  if (level >= 100) return 10;
  return Math.min(Math.floor(level / 10) + 1, 10);
}

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
  data?: {
    members: any[];
    memberCount: number;
    settlementId: string;
    source: string;
    lastUpdated: string;
  };
  error?: string;
}

type SortDirection = 'asc' | 'desc' | null;



export function SettlementSkillsView() {
  const router = useRouter();
  const [skillsData, setSkillsData] = useState<SkillsAnalytics | null>(null);
  const [citizensData, setCitizensData] = useState<CitizenSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SkillsResponse['meta'] | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // View options state
  const [showAdventureSkills, setShowAdventureSkills] = useState(true);
  const [showTierColors, setShowTierColors] = useState(true);

  const { selectedSettlement } = useSelectedSettlement();
  const { member, isLoading: memberLoading } = useCurrentMember();
  const { getSkillName, loading: skillNamesLoading } = useSkillNames();

  // Memoize all computed values OUTSIDE of conditional renders
  const membersWithSkills = useMemo(() => 
    Array.isArray(citizensData) ? citizensData.filter(m => m.totalSkillLevel > 0) : [],
    [citizensData]
  );

  const allSkillLevels = useMemo(() => {
    if (!Array.isArray(citizensData) || citizensData.length === 0) return [];
    
    const adventureSkills = ['Cooking', 'Construction', 'Taming', 'Slayer', 'Merchanting', 'Sailing'];
    return membersWithSkills.flatMap(member =>
      Object.entries(member.skills || {})
        .filter(([skillName, level]) => {
          const displayName = getSkillName(skillName);
          return level > 0 && !adventureSkills.includes(displayName);
        })
        .map(([, level]) => level)
    );
  }, [membersWithSkills, getSkillName]);

  const closeToTieringUp = useMemo(() => {
    if (!Array.isArray(citizensData) || citizensData.length === 0) return [];
    
    const candidates: Array<{
      name: string;
      skillName: string;
      currentLevel: number;
      nextTier: number;
      levelsToGo: number;
      profession: string;
    }> = [];

    membersWithSkills.forEach(member => {
      Object.entries(member.skills || {}).forEach(([skillId, level]) => {
        const skillDisplayName = getSkillName(skillId);
        
        // Skip adventure skills if they're hidden
        const adventureSkills = ['cooking', 'construction', 'taming', 'slayer', 'merchanting', 'sailing'];
        if (!showAdventureSkills && adventureSkills.some(adventure => 
          skillDisplayName.toLowerCase().includes(adventure)
        )) {
          return;
        }

        // Calculate next tier milestone (10, 20, 30, 40, 50, 60, etc.)
        const currentTier = getSkillTier(level);
        const nextTierLevel = currentTier * 10; // Next milestone level
        
        // Only consider if they're close (within 2 levels) and not at max tier
        if (level > 0 && level < 100 && nextTierLevel - level <= 2 && nextTierLevel - level > 0) {
          candidates.push({
            name: member.name,
            skillName: skillDisplayName,
            currentLevel: level,
            nextTier: currentTier + 1,
            levelsToGo: nextTierLevel - level,
            profession: member.profession
          });
        }
      });
    });

    // Sort by levels to go (closest first), then by next tier level (higher tiers first)
    return candidates
      .sort((a, b) => {
        if (a.levelsToGo !== b.levelsToGo) {
          return a.levelsToGo - b.levelsToGo; // Closest first
        }
        return b.nextTier - a.nextTier; // Higher tiers first if same distance
      })
      .slice(0, 10); // Top 10
  }, [membersWithSkills, getSkillName, showAdventureSkills]);

  const professionPeaks = useMemo(() => {
    if (!Array.isArray(citizensData) || citizensData.length === 0) return [];
    
    const professionSkills = [
      'forestry', 'carpentry', 'masonry', 'mining', 'smithing', 'scholar',
      'leatherworking', 'hunting', 'tailoring', 'farming', 'fishing', 'foraging'
    ];
    
    return professionSkills.map(professionKey => {
      let maxLevel = 0;
      let topMember = '';
      
      membersWithSkills.forEach(member => {
        Object.entries(member.skills || {}).forEach(([skillName, level]) => {
          const displayName = getSkillName(skillName).toLowerCase();
          if (displayName.includes(professionKey) && level > maxLevel) {
            maxLevel = level;
            topMember = member.name;
          }
        });
      });
      
      return {
        profession: professionKey.charAt(0).toUpperCase() + professionKey.slice(1),
        maxLevel,
        topMember
      };
    }).filter(p => p.maxLevel > 0).sort((a, b) => b.maxLevel - a.maxLevel);
  }, [membersWithSkills, getSkillName]);

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
      const memberData: CitizenSkills[] = rawMembers.map((member: { name?: string; entity_id?: string; id?: string; top_profession?: string; total_level?: number; total_xp?: number; skills?: Record<string, number> }) => ({
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

  // Get all unique skills across all citizens with proper names
  const allSkills = useMemo(() => {
    const skillIds = Array.from(
      new Set(
        (Array.isArray(citizensData) ? citizensData : []).flatMap(citizen => Object.keys(citizen.skills || {}))
      )
    ).sort();
    
    // Map skill IDs to names for display
    return skillIds.map(skillId => ({
      id: skillId,
      name: getSkillName(skillId)
    }));
  }, [citizensData, getSkillName]);

  // Group skills by category for better organization
  const groupedSkills = useMemo(() => {
    const groups: { [key: string]: typeof allSkills } = {};
    
    // Initialize groups
    const categories = ['Profession Skills', 'Adventure Skills', 'Other Skills'];
    categories.forEach(category => {
      groups[category] = [];
    });
    
    // Core profession skills as shown in the game
    const professionSkills = [
      'forestry', 'carpentry', 'masonry', 'mining', 'smithing', 'scholar',
      'leatherworking', 'hunting', 'tailoring', 'farming', 'fishing', 'foraging'
    ];
    
    // Adventure skills as shown in the game
    const adventureSkills = [
      'cooking', 'construction', 'taming', 'slayer', 'merchanting', 'sailing'
    ];
    
    // Categorize skills based on name patterns
    allSkills.forEach(skill => {
      let categorized = false;
      const skillName = skill.name.toLowerCase();
      
      // Check if this is a profession skill
      if (professionSkills.some(profession => skillName.includes(profession))) {
        groups['Profession Skills'].push(skill);
        categorized = true;
      }
      // Check if this is an adventure skill
      else if (adventureSkills.some(adventure => skillName.includes(adventure))) {
        groups['Adventure Skills'].push(skill);
        categorized = true;
      }
      
      // If not categorized, put in Other Skills
      if (!categorized) {
        groups['Other Skills'].push(skill);
      }
    });
    
    // Return only non-empty groups, optionally filtering out Adventure Skills
    const filteredGroups = Object.entries(groups).filter(([_, skills]) => skills.length > 0);
    
    if (!showAdventureSkills) {
      return filteredGroups.filter(([groupName, _]) => groupName !== 'Adventure Skills');
    }
    
    return filteredGroups;
  }, [allSkills, showAdventureSkills]);


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

          let aValue: string | number, bValue: string | number;

    if (sortField === 'name') {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (sortField === 'profession') {
      aValue = a.profession.toLowerCase();
      bValue = b.profession.toLowerCase();
    } else if (sortField === 'totalSkillLevel') {
      aValue = a.totalSkillLevel;
      bValue = b.totalSkillLevel;
    } else if (allSkills.some(skill => skill.id === sortField)) {
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

  if (loading || skillNamesLoading) {
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
      {(Array.isArray(citizensData) && citizensData.length > 0) && (() => {
        // Calculate average skill level (profession skills only)
        const avgSkillLevel = allSkillLevels.length > 0 
          ? allSkillLevels.reduce((sum, level) => sum + level, 0) / allSkillLevels.length 
          : 0;

        // Find highest individual profession skill
        const highestSkill = Math.max(...allSkillLevels, 0);

        // Calculate highest skill in each profession
        const professionSkills = [
          'forestry', 'carpentry', 'masonry', 'mining', 'smithing', 'scholar',
          'leatherworking', 'hunting', 'tailoring', 'farming', 'fishing', 'foraging'
        ];

        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profession Peaks</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {professionSkills.map(professionKey => {
                    const professionData = professionPeaks.find(p => 
                      p.profession.toLowerCase() === professionKey
                    );
                    const maxLevel = professionData?.maxLevel || 0;
                    const topMember = professionData?.topMember || '';
                    const professionName = professionKey.charAt(0).toUpperCase() + professionKey.slice(1);
                    
                    return (
                      <Tooltip key={professionKey}>
                        <TooltipTrigger asChild>
                          <div className="flex justify-between items-center text-xs min-w-0 hover:bg-muted/30 px-1 py-0.5 rounded transition-colors cursor-default">
                            <span className="text-muted-foreground truncate mr-2">{professionName}</span>
                            <span className={`font-medium flex-shrink-0 ${maxLevel > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                              {maxLevel > 0 ? maxLevel : '-'}
                            </span>
                          </div>
                        </TooltipTrigger>
                        {maxLevel > 0 && topMember && (
                          <TooltipContent>
                            <p>{professionName} - Level {maxLevel} by {topMember}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Skill</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-4xl font-bold mb-1">{avgSkillLevel.toFixed(1)}</div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Profession skills only</p>
                  <div className="relative w-full bg-muted rounded-full h-6 flex items-center">
                    <div 
                      className={`h-6 rounded-full transition-all ${getSettlementTierBadgeClasses(getSkillTier(avgSkillLevel)).split(' ')[0]}`}
                      style={{ width: `${(() => {
                        const tier = getSkillTier(avgSkillLevel);
                        if (tier === 0) return 0;
                        if (tier === 10) return 100; // Max tier is always full
                        
                        // Calculate progress within current tier (0-9, 10-19, 20-29, 30-39, etc.)
                        const tierStart = (tier - 1) * 10;
                        const tierEnd = tier * 10 - 1;
                        const progressInTier = ((avgSkillLevel - tierStart) / (tierEnd - tierStart)) * 100;
                        return Math.min(Math.max(progressInTier, 0), 100);
                      })()}%` }}
                    />
                    <div className="absolute left-2">
                      <TierIcon tier={getSkillTier(avgSkillLevel)} size="sm" variant="game-asset" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Tier {getSkillTier(avgSkillLevel)} progression</p>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Close to Tiering Up</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-1">
                {closeToTieringUp.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-lg font-bold mb-2">{closeToTieringUp.length} members</div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {closeToTieringUp.slice(0, 6).map((candidate, index) => (
                        <div key={`${candidate.name}-${candidate.skillName}`} className="flex justify-between items-center text-xs">
                          <div className="flex flex-col min-w-0 flex-1 mr-2">
                            <span className="font-medium truncate">{candidate.name}</span>
                            <span className="text-muted-foreground truncate">{candidate.skillName}</span>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <span className="text-muted-foreground">{candidate.currentLevel}</span>
                            <ArrowUp className="h-3 w-3 text-green-500" />
                            <span className="font-medium text-green-600">{candidate.currentLevel + candidate.levelsToGo}</span>
                          </div>
                        </div>
                      ))}
                      {closeToTieringUp.length > 6 && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          +{closeToTieringUp.length - 6} more
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Ready for next tier</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">No members close to tiering up</div>
                    <div className="text-xs text-muted-foreground">Level up to see opportunities</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Skill</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-4xl font-bold mb-1">{highestSkill}</div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Highest profession skill</p>
                  <div className="relative w-full bg-muted rounded-full h-6 flex items-center">
                    <div 
                      className={`h-6 rounded-full transition-all ${getSettlementTierBadgeClasses(getSkillTier(highestSkill)).split(' ')[0]}`}
                      style={{ width: `${(() => {
                        const tier = getSkillTier(highestSkill);
                        if (tier === 0) return 0;
                        if (tier === 10) return 100; // Max tier is always full
                        
                        // Calculate progress within current tier (0-9, 10-19, 20-29, 30-39, etc.)
                        const tierStart = (tier - 1) * 10;
                        const tierEnd = tier * 10 - 1;
                        const progressInTier = ((highestSkill - tierStart) / (tierEnd - tierStart)) * 100;
                        return Math.min(Math.max(progressInTier, 0), 100);
                      })()}%` }}
                    />
                    <div className="absolute left-2">
                      <TierIcon tier={getSkillTier(highestSkill)} size="sm" variant="game-asset" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Tier {getSkillTier(highestSkill)} achievement</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}



      {/* Member Skills Matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>Member Skills Matrix</CardTitle>
              <CardDescription>
                {showAdventureSkills 
                  ? "Skills are organized by category (Profession Skills and Adventure Skills) with visual separators." 
                  : "Showing only Profession Skills with visual separators."
                } Click column headers to sort by skill level. Click member names to view their details.
              </CardDescription>
            </div>
            
            {/* View Options Toggles - moved to top right */}
            <div className="flex flex-col items-end space-y-2 ml-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="adventure-skills-toggle" className="text-sm font-medium whitespace-nowrap">
                  Adventure Skills
                </Label>
                <Switch
                  id="adventure-skills-toggle"
                  checked={showAdventureSkills}
                  onCheckedChange={setShowAdventureSkills}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="tier-colors-toggle" className="text-sm font-medium whitespace-nowrap">
                  Tier Colors
                </Label>
                <Switch
                  id="tier-colors-toggle"
                  checked={showTierColors}
                  onCheckedChange={setShowTierColors}
                />
              </div>
            </div>
          </div>
          
          {/* Tier Color Legend - Compact */}
          {showTierColors && (
          <div className="mt-4 p-3 bg-muted/20 rounded border">
            <div className="flex items-center gap-4">
              <h4 className="text-xs font-medium flex items-center gap-1.5">
                <Target className="h-3 w-3" />
                Skill Level Colors:
              </h4>
              <div className="flex items-center gap-1">
                {[
                  { tier: 0, label: "0" },
                  { tier: 1, label: "1-10" },
                  { tier: 2, label: "11-20" },
                  { tier: 3, label: "21-30" },
                  { tier: 4, label: "31-40" },
                  { tier: 5, label: "41-50" },
                  { tier: 6, label: "51-60" },
                  { tier: 7, label: "61-70" },
                  { tier: 8, label: "71-80" },
                  { tier: 9, label: "81-90" },
                  { tier: 10, label: "91-100" }
                ].map(({ tier, label }) => (
                  <div key={tier} className="flex flex-col items-center">
                    <div className={`w-8 h-4 rounded text-xs font-medium flex items-center justify-center border ${getSettlementTierBadgeClasses(tier)}`}>
                      {tier === 10 ? '100' : tier === 0 ? '0' : `${tier * 10}`}
                    </div>
                    <span className="text-muted-foreground text-xs mt-0.5">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {/* Floating Sticky Headers */}
          <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
            <div className="overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  {/* Group Header Row */}
                  <TableRow>
                    <TableHead className="border-r w-48 bg-background"></TableHead>
                    {groupedSkills.map(([groupName, skills]) => (
                      <TableHead 
                        key={groupName} 
                        colSpan={skills.length}
                        className="bg-muted/30 border-x border-muted font-semibold text-sm text-center p-2"
                      >
                        {groupName}
                      </TableHead>
                    ))}
                  </TableRow>
                  
                  {/* Individual Skill Header Row */}
                  <TableRow>
                    <TableHead className="border-r w-48 bg-background">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('name')}
                        className="h-auto p-2 font-medium hover:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <span>Member</span>
                          {renderSortIcon('name')}
                        </div>
                      </Button>
                    </TableHead>
                    {groupedSkills.map(([groupName, skills], groupIndex) => 
                      skills.map((skill, skillIndex) => (
                        <TableHead 
                          key={skill.id} 
                          className={`bg-background text-center min-w-[100px] p-2 ${
                            skillIndex === 0 ? 'border-l-2 border-muted' : ''
                          } ${skillIndex === skills.length - 1 ? 'border-r-2 border-muted' : ''}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort(skill.id)}
                            className="h-auto p-2 font-medium text-xs hover:bg-muted"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-medium">{skill.name}</span>
                              {renderSortIcon(skill.id)}
                            </div>
                          </Button>
                        </TableHead>
                      ))
                    )}
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
          </div>

          {/* Scrollable Table Content */}
          <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
            <Table className="table-fixed">
              {/* No headers in scrollable table - they're now floating above */}
              <TableBody>
                {sortedCitizens.map((citizen, index) => {
                  const citizenKey = citizen.entityId || `citizen-${index}`;
                  return (
                    <TableRow key={citizenKey} className="hover:bg-muted/30">
                      <TableCell className="sticky left-0 bg-background z-10 border-r font-medium p-3 w-48">
                        <div className="truncate">
                          <button
                            onClick={() => router.push(`/en/settlement/members/${encodeURIComponent(citizen.entityId)}`)}
                            className="font-medium text-sm hover:text-primary hover:underline cursor-pointer text-left w-full"
                          >
                            {citizen.name}
                          </button>
                          <div className="text-xs text-muted-foreground truncate">
                            <span className="font-medium">{citizen.totalSkillLevel}</span> skills • <span className="capitalize">{citizen.profession}</span>
                          </div>
                        </div>
                      </TableCell>
                      {groupedSkills.map(([groupName, skills], groupIndex) => 
                        skills.map((skill, skillIndex) => {
                          const level = citizen.skills[skill.id] || 0;
                          return (
                            <TableCell 
                              key={`${citizenKey}-${skill.id}`} 
                              className={`text-center p-2 ${
                                skillIndex === 0 ? 'border-l-2 border-muted/50' : ''
                              } ${skillIndex === skills.length - 1 ? 'border-r-2 border-muted/50' : ''}`}
                            >
                              {level > 0 ? (
                                <div className={`inline-flex items-center justify-center min-w-[50px] h-7 px-2 rounded-md border ${
                                  showTierColors 
                                    ? getSettlementTierBadgeClasses(getSkillTier(level))
                                    : 'bg-gray-800 text-white border-gray-700'
                                }`}>
                                  <span className="text-sm font-medium">{level}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          );
                        })
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {(Array.isArray(citizensData) ? citizensData : []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No member skill data available</p>
              <p className="text-sm">Data may still be syncing from the game</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </Container>
  );
} 