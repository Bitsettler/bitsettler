'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Container } from '../../components/container';
import { AlertCircle, RefreshCw, Beaker, TrendingUp, Target, CheckCircle2, Clock, Lock, ArrowDown, ChevronDown } from 'lucide-react';
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
import { getSettlementTierBadgeClasses } from '../../lib/settlement/tier-colors';
import { TierIcon } from '../../components/ui/tier-icon';

interface ResearchItem {
  description: string;
  tier: number;
  isCompleted: boolean;
}

interface ResearchResponse {
  success: boolean;
  data?: ResearchItem[];
  error?: string;
  meta?: {
    settlementId: string;
    settlementName: string;
    totalResearch: number;
    completedResearch: number;
    highestTier: number;
    dataSource: string;
    lastUpdated: string;
  };
}

export function SettlementResearchView() {
  const [researchData, setResearchData] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ResearchResponse['meta'] | null>(null);

  const { selectedSettlement } = useSelectedSettlement();

  useEffect(() => {
    fetchResearchData();
  }, [selectedSettlement?.id]);

  const fetchResearchData = async () => {
    // Don't fetch data if no settlement is selected
    if (!selectedSettlement) {
      setLoading(false);
      setResearchData([]);
      setMeta(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/settlement/research?settlementId=${selectedSettlement.id}`);
      const result: ResearchResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch research data');
      }

      setResearchData(result.data || []);
      setMeta(result.meta || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  // Group research by tier
  const researchByTier = researchData.reduce((acc, item) => {
    if (!acc[item.tier]) {
      acc[item.tier] = [];
    }
    acc[item.tier].push(item);
    return acc;
  }, {} as Record<number, ResearchItem[]>);

  const sortedTiers = Object.keys(researchByTier)
    .map(Number)
    .sort((a, b) => b - a); // Pyramid: Higher tiers at top

  if (loading) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Research</h1>
              <p className="text-muted-foreground text-sm">
                Track settlement research progress and unlocked capabilities.
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
              <Card key={i}>
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

          {/* Loading Research Cards */}
          <div className="space-y-6">
            {[1, 2, 3].map((tier) => (
              <Card key={tier}>
                <CardHeader>
                  <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
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
            <h1 className="text-3xl font-bold">Research</h1>
            <p className="text-muted-foreground text-sm">
              Track settlement research progress and unlocked capabilities.
            </p>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500 font-medium">Error loading research data</p>
                <p className="text-muted-foreground text-sm mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchResearchData} className="mt-4">
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

  return (
    <Container>
      <div className="space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Research</h1>
            <p className="text-muted-foreground text-sm">
              Track settlement research progress and unlocked capabilities.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchResearchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Analytics Cards */}
        {meta && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Research</CardTitle>
                <Beaker className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(meta.totalResearch)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(meta.completedResearch)} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Tier</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">Tier {meta.highestTier}</div>
                <div className="relative">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${getSettlementTierBadgeClasses(meta.highestTier).split(' ')[0]}`}
                      style={{ width: `${(meta.highestTier / 10) * 100}%` }}
                    />
                  </div>
                  <div className="absolute left-1 -top-0.5">
                    <TierIcon tier={meta.highestTier} size="sm" variant="game-asset" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Settlement progression</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">
                  {meta.totalResearch > 0 ? Math.round((meta.completedResearch / meta.totalResearch) * 100) : 0}%
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all bg-gradient-to-r from-blue-500 to-purple-600"
                    style={{ 
                      width: `${meta.totalResearch > 0 ? Math.round((meta.completedResearch / meta.totalResearch) * 100) : 0}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Overall completion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Settlement</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{meta.settlementName}</div>
                <p className="text-xs text-muted-foreground">Currently viewing</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Research Pyramid */}
        <div className="space-y-4">
          {sortedTiers.length > 0 ? (
            sortedTiers.map((tier, index) => {
              // Calculate pyramid styling - wider for higher tiers at top
              const maxWidth = Math.min(100, 40 + (tier * 6)); // 40% to 100% width
              const isLocked = index > 0 && !researchByTier[sortedTiers[index - 1]]?.every(item => item.isCompleted);
              
              return (
                <div key={tier} className="relative">
                  {/* Progression Arrow */}
                  {index > 0 && (
                    <div className="flex justify-center mb-3">
                      <div className="flex flex-col items-center">
                        <ChevronDown className="h-6 w-6 text-muted-foreground/60" />
                        <div className="text-xs text-muted-foreground text-center">Requires previous tier completion</div>
                      </div>
                    </div>
                  )}
                  
                  <div 
                    className="mx-auto transition-all duration-300"
                    style={{ maxWidth: `${maxWidth}%` }}
                  >
                    <Card 
                      key={tier}
                      className={`transition-all duration-300 ${
                        isLocked 
                          ? 'opacity-60 border-dashed bg-muted/30' 
                          : 'shadow-lg hover:shadow-xl'
                      }`}
                    >
                <CardHeader className="text-center">
                  <CardTitle className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      {tier > 0 && <TierIcon tier={tier} size="md" variant="game-asset" />}
                      <Badge className={getSettlementTierBadgeClasses(tier)}>
                        Tier {tier}
                      </Badge>
                      {isLocked && <span className="text-sm text-muted-foreground">🔒</span>}
                    </div>
                    <span className="text-lg font-semibold">
                      {tier >= 9 ? "Legendary" : tier >= 7 ? "Master" : tier >= 5 ? "Expert" : tier >= 3 ? "Advanced" : "Foundation"}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-center">
                    {researchByTier[tier].length} research item{researchByTier[tier].length !== 1 ? 's' : ''} in this tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {researchByTier[tier].map((item, index) => (
                      <div 
                        key={index} 
                        className={`p-3 border rounded-lg transition-colors ${
                          item.isCompleted 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {item.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-5">{item.description}</p>
                            <Badge 
                              variant="outline" 
                              className={`mt-1 text-xs ${
                                item.isCompleted ? 'text-green-700 border-green-300' : ''
                              }`}
                            >
                              {item.isCompleted ? 'Completed' : 'In Progress'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Beaker className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No research data available</p>
                <p className="text-sm text-muted-foreground">Research data may still be loading from BitJita</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}