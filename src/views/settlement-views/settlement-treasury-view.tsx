'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/components/container';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Filter, 
  Search, 
  Plus, 
  RefreshCw, 
  Clock, 
  BarChart3 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

interface TreasurySummary {
  id: string;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  lastTransactionDate: Date | null;
  lastUpdated: Date;
  createdAt: Date;
}

interface TreasuryStats {
  monthlyIncome: number;
  monthlyExpenses: number;
  netChange: number;
  transactionCount: number;
  averageTransactionSize: number;
}

interface TreasuryTransaction {
  id: string;
  amount: number;
  transactionType: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
  category: string | null;
  description: string | null;
  relatedProjectId: string | null;
  relatedMemberId: string | null;
  transactionDate: Date;
  createdAt: Date;
  createdBy: string;
}

interface TreasurySummaryResponse {
  success: boolean;
  data: {
    summary: TreasurySummary | null;
    stats: TreasuryStats;
  };
  error?: string;
}

interface TransactionsResponse {
  success: boolean;
  data: TreasuryTransaction[];
  count: number;
  pagination: {
    limit?: number;
    offset?: number;
  };
  error?: string;
}

interface CategoriesResponse {
  success: boolean;
  data: Array<{ category: string; count: number }>;
  count: number;
  error?: string;
}

interface TreasurySnapshot {
  settlementId: string;
  balance: number;
  previousBalance?: number;
  changeAmount?: number;
  supplies?: number;
  tier?: number;
  numTiles?: number;
  recordedAt: Date;
  dataSource: string;
}

interface TreasuryHistoryResponse {
  success: boolean;
  data: TreasurySnapshot[];
  count: number;
  meta: {
    settlementId: string;
    timeRange: number;
    timeUnit: string;
    dataSource: string;
  };
  error?: string;
}

const transactionTypeIcons = {
  'Income': ArrowUpRight,
  'Expense': ArrowDownRight,
  'Transfer': RefreshCw,
  'Adjustment': Plus,
};

const transactionTypeColors = {
  'Income': 'text-green-600 bg-green-50 border-green-200',
  'Expense': 'text-red-600 bg-red-50 border-red-200',
  'Transfer': 'text-blue-600 bg-blue-50 border-blue-200',
  'Adjustment': 'text-purple-600 bg-purple-50 border-purple-200',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount);
}

const formatHexcoin = (amount: number): string => {
  return `${formatCurrency(amount)} 🪙`;
};

export function SettlementTreasuryView() {
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Treasury history state
  const [history, setHistory] = useState<TreasurySnapshot[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<number>(30); // 30 days default instead of 7 days
  const [timeUnit, setTimeUnit] = useState<'days' | 'months'>('days'); // New time unit state
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  

  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchSummaryData();
    fetchCategories();
    fetchTransactions();
    fetchTreasuryHistory();

    
    // Set up periodic refresh every 5 minutes for live treasury data
    const interval = setInterval(() => {
      fetchSummaryData();
      setLastUpdate(new Date());
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, currentPage]);

  useEffect(() => {
    fetchTreasuryHistory();
  }, [timeRange, timeUnit]); // Add timeUnit to dependencies

  async function fetchSummaryData() {
    try {
      setError(null);
      const response = await fetch('/api/settlement/treasury?action=summary');
      const data: TreasurySummaryResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch treasury summary');
      }

      setSummary(data.data.summary);
      setStats(data.data.stats);
    } catch (err) {
      console.error('Error fetching treasury summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load treasury data');
    }
  }

  async function fetchCategories() {
    try {
      const response = await fetch('/api/settlement/treasury?action=categories');
      const data: CategoriesResponse = await response.json();

      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  async function fetchTransactions() {
    try {
      setTransactionsLoading(true);
      
      const params = new URLSearchParams({
        action: 'transactions',
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
      });

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      const response = await fetch(`/api/settlement/treasury?${params}`);
      const data: TransactionsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      setTransactions(data.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTransactionsLoading(false);
      setLoading(false);
    }
  }

  async function fetchTreasuryHistory() {
    try {
      setHistoryLoading(true);
      const settlementId = '504403158277057776'; // Port Taverna
      
      const response = await fetch(
        `/api/settlement/treasury?action=history&settlementId=${settlementId}&timeRange=${timeRange}&timeUnit=${timeUnit}`
      );
      const data: TreasuryHistoryResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch treasury history');
      }

      // Convert string dates back to Date objects
      const historyWithDates = data.data.map(snapshot => ({
        ...snapshot,
        recordedAt: new Date(snapshot.recordedAt)
      }));

      setHistory(historyWithDates);
    } catch (err) {
      console.error('Error fetching treasury history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }



  // Filter transactions by search term
  const filteredTransactions = transactions.filter(transaction =>
    (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Container>
        <div className="space-y-8 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive mb-4">
                  <Search className="h-5 w-5" />
                  <span className="font-medium">Failed to load treasury</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchSummaryData} variant="outline" className="w-full">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6 py-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Settlement Treasury</h1>
          <p className="text-muted-foreground text-sm">
            Live treasury balance from the game • Updates every 5 minutes
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}
        </div>
      </div>

      {/* Live Treasury Balance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Treasury Balance</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">
            {summary ? formatHexcoin(summary.currentBalance) : '0 🪙'}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {summary?.lastUpdated ? 
                `Last updated: ${new Date(summary.lastUpdated).toLocaleString()}` :
                'Loading...'
              }
            </span>
            <span>•</span>
            <span>Tier 6 Settlement</span>
            <span>•</span>
            <span>7,981 tiles</span>
          </div>
        </CardContent>
      </Card>

      {/* Treasury History Chart */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Treasury History</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Select 
                  value={`${timeRange}-${timeUnit}`} 
                  onValueChange={(value) => {
                    const [range, unit] = value.split('-');
                    setTimeRange(parseInt(range));
                    setTimeUnit(unit as 'days' | 'months');
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-days">1 Day</SelectItem>
                    <SelectItem value="3-days">3 Days</SelectItem>
                    <SelectItem value="7-days">7 Days</SelectItem>
                    <SelectItem value="14-days">2 Weeks</SelectItem>
                    <SelectItem value="30-days">30 Days</SelectItem>
                    <SelectItem value="1-months">1 Month</SelectItem>
                    <SelectItem value="3-months">3 Months</SelectItem>
                    <SelectItem value="6-months">6 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="h-32 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Recent Change:</span>
                    <div className="font-medium">
                      {history.length > 1 && history[history.length - 1].changeAmount !== null && history[history.length - 1].changeAmount !== undefined ? (
                        <span className={history[history.length - 1].changeAmount! >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {history[history.length - 1].changeAmount! >= 0 ? '+' : ''}
                          {formatCurrency(history[history.length - 1].changeAmount!)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No change</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Snapshots:</span>
                    <div className="font-medium">{history.length} recorded</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time Range:</span>
                    <div className="font-medium">
                      {timeRange} {timeUnit === 'days' ? (timeRange === 1 ? 'day' : 'days') : (timeRange === 1 ? 'month' : 'months')}
                    </div>
                  </div>
                </div>
                
                {/* Treasury Balance Chart */}
                <div className="h-64 border rounded-lg p-4 bg-gradient-to-b from-background to-muted/20">
                  {(() => {
                    if (history.length === 0) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                          <BarChart3 className="h-8 w-8 opacity-50 mb-2" />
                          <span className="font-medium">No treasury data available</span>
                          <span className="text-xs mt-1">Try selecting a different time range</span>
                        </div>
                      );
                    }

                    if (history.length < 2) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                          <BarChart3 className="h-8 w-8 opacity-50 mb-2" />
                          <span className="font-medium">Not enough data for chart</span>
                          <span className="text-xs mt-1">Need at least 2 data points • Currently have {history.length}</span>
                        </div>
                      );
                    }

                    // Transform data for the chart - handle same-date scenarios
                    const chartData = history.map((snapshot, index) => ({
                      date: snapshot.recordedAt.toLocaleDateString(),
                      time: snapshot.recordedAt.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }),
                      dateTime: `${snapshot.recordedAt.toLocaleDateString()} ${snapshot.recordedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
                      balance: snapshot.balance,
                      formattedDate: snapshot.recordedAt.toLocaleString(),
                      index: index,
                      label: `#${index + 1}` // Sequential label for same-date data
                    }));

                    // Check if all dates are the same
                    const uniqueDates = [...new Set(chartData.map(d => d.date))];
                    const allSameDate = uniqueDates.length === 1;
                    const balanceMin = Math.min(...chartData.map(d => d.balance));
                    const balanceMax = Math.max(...chartData.map(d => d.balance));
                    const balanceRange = balanceMax - balanceMin;

                    // Debug the data
                
                    console.log('   History Length:', history.length);
                    console.log('   Unique Dates:', uniqueDates);
                    console.log('   Balance Range:', { min: balanceMin, max: balanceMax, range: balanceRange });
                    console.log('   All Same Date:', allSameDate);
                    console.log('   Sample Data:', chartData.slice(0, 3));

                    // Chart configuration for ShadCN theming
                    const chartConfig: ChartConfig = {
                      balance: {
                        label: "Treasury Balance",
                        color: "hsl(var(--primary))",
                      },
                    };

                    return (
                      <ChartContainer config={chartConfig} className="h-full w-full">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey={allSameDate ? "label" : "dateTime"}
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                              if (allSameDate) {
                                return value; // Show #1, #2, #3, etc.
                              }
                              return value.split(' ')[0]; // Show date
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatCurrency(value)}
                            domain={
                              balanceRange < 100 
                                ? [balanceMin - 50, balanceMax + 50] // Tight range for small changes
                                : ['dataMin - 100', 'dataMax + 100'] // Normal range
                            }
                          />
                          <ChartTooltip 
                            content={
                              <ChartTooltipContent 
                                labelFormatter={(label, payload) => {
                                  if (payload && payload.length > 0) {
                                    return payload[0]?.payload?.formattedDate || label;
                                  }
                                  return label;
                                }}
                                formatter={(value) => [formatHexcoin(value as number), "Balance"]}
                              />
                            }
                          />
                          <Line 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="var(--color-balance)" 
                            strokeWidth={3} // Thicker line for better visibility
                            dot={{ fill: "var(--color-balance)", strokeWidth: 2, r: 5 }} // Bigger dots
                            activeDot={{ r: 8, fill: "var(--color-balance)" }}
                          />
                        </LineChart>
                      </ChartContainer>
                    );
                  })()}
                </div>
                
                {/* Chart Summary */}
                <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                  <span>📈 Trend</span>
                  <span className="text-center">
                    {history.length > 0 && (
                      <>Min: {formatHexcoin(Math.min(...history.map(h => h.balance)))} • Max: {formatHexcoin(Math.max(...history.map(h => h.balance)))}</>
                    )}
                  </span>
                  <span>{history.length} snapshots</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

              {/* Transaction History & Manual Adjustments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History & Manual Adjustments</CardTitle>
                <CardDescription>
                  All treasury transactions, manual adjustments, and financial activity
                </CardDescription>
              </div>
              <Button className="gap-2" disabled>
                <Plus className="h-4 w-4" />
                Add Manual Entry
              </Button>
            </div>
            
            {/* Stats Row for Manual Adjustments */}
            <div className="grid gap-4 md:grid-cols-3 mt-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Manual Income</div>
                <div className="text-lg font-medium text-emerald-600">
                  {stats ? formatCurrency(stats.monthlyIncome) : '0'}
                </div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Manual Expenses</div>
                <div className="text-lg font-medium text-red-500">
                  {stats ? formatCurrency(stats.monthlyExpenses) : '0'}
                </div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Net Change</div>
                <div className={`text-lg font-medium ${stats && stats.netChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stats ? formatCurrency(stats.netChange) : '0'}
                </div>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Expense">Expense</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transactions List */}
          {transactionsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No transactions found</p>
                  <p>Try adjusting your search terms or filters.</p>
                </>
              ) : (
                <>
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No transactions yet</p>
                  <p>Treasury transactions will appear here when they&apos;re recorded.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTransactions.map((transaction) => {
                const TypeIcon = transactionTypeIcons[transaction.transactionType];
                return (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-muted/50 rounded px-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${transactionTypeColors[transaction.transactionType]}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {transaction.description || `${transaction.transactionType} Transaction`}
                          </span>
                          {transaction.category && (
                            <Badge variant="secondary" className="text-xs">
                              {transaction.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.transactionDate).toLocaleDateString()} • 
                          {transaction.transactionType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        transaction.transactionType === 'Income' ? 'text-green-600' : 
                        transaction.transactionType === 'Expense' ? 'text-red-600' : 
                        'text-muted-foreground'
                      }`}>
                        {transaction.transactionType === 'Income' ? '+' : 
                         transaction.transactionType === 'Expense' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Info */}
          {filteredTransactions.length > 0 && (
            <div className="mt-6 text-sm text-muted-foreground text-center">
              Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              {searchTerm && ' matching your search'}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </Container>
  );
} 