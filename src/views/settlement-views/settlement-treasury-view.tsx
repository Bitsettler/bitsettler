'use client';

import { useState, useEffect } from 'react';
import { useCurrentMember } from '@/hooks/use-current-member';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
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

interface TreasuryTransaction {
  id: string;
  amount: number;
  transactionType: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
  category: string | null;
  description: string | null;
  relatedProjectId: string | null;
  relatedMemberId: string | null;
  relatedProjectName?: string;
  relatedMemberName?: string;
  transactionDate: Date;
  createdAt: Date;
  createdBy: string;
}

interface TreasurySummaryResponse {
  success: boolean;
  data: {
    summary: TreasurySummary | null;
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
  const { member, isLoading: memberLoading } = useCurrentMember();
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Treasury history state
  const [history, setHistory] = useState<TreasurySnapshot[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<number>(30); // 30 days default instead of 7 days
  const [timeUnit, setTimeUnit] = useState<'days' | 'months'>('days'); // New time unit state
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [triedFallback, setTriedFallback] = useState<boolean>(false);
  

  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Add transaction modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    transactionType: 'Income' as 'Income' | 'Expense' | 'Transfer' | 'Adjustment',
    description: ''
  });

  useEffect(() => {
    if (!memberLoading && member?.settlement_id) {
      fetchSummaryData();
      fetchTransactions();
      fetchTreasuryHistory();

      
      // Set up periodic refresh every 5 minutes for live treasury data
      const interval = setInterval(() => {
        fetchSummaryData();
        setLastUpdate(new Date());
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [memberLoading, member?.settlement_id]);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, currentPage]);

  useEffect(() => {
    fetchTreasuryHistory();
  }, [timeRange, timeUnit]); // Add timeUnit to dependencies

  async function fetchSummaryData() {
    if (!member?.settlement_id) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/settlement/treasury?action=summary&settlementId=${member.settlement_id}`);
      const data: TreasurySummaryResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch treasury summary');
      }

      setSummary(data.data.summary);
      setLastUpdate(new Date()); // Set lastUpdate when data is successfully fetched
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load treasury data');
    }
  }

  async function fetchTransactions() {
    if (!member?.settlement_id) return;
    
    try {
      setTransactionsLoading(true);
      
      const params = new URLSearchParams({
        action: 'transactions',
        settlementId: member.settlement_id,
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
        includeDetails: 'true',
      });

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const response = await fetch(`/api/settlement/treasury?${params}`);
      const data: TransactionsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      setTransactions(data.data || []);
    } catch (err) {
      // Transaction fetch failed
    } finally {
      setTransactionsLoading(false);
      setLoading(false);
    }
  }

  async function fetchTreasuryHistory() {
    if (!member?.settlement_id) return;
    
    try {
      setHistoryLoading(true);
      
      const response = await fetch(
        `/api/settlement/treasury?action=history&settlementId=${member.settlement_id}&timeRange=${timeRange}&timeUnit=${timeUnit}`
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

      // If the selected range has no data, try a broader fallback once
      if (historyWithDates.length === 0 && !triedFallback) {
        setTriedFallback(true);
        setTimeUnit('months');
        setTimeRange(6); // broaden to last 6 months
        return; // the useEffect will retrigger fetch with new range
      }

      setHistory(historyWithDates);
    } catch (err) {
      // Treasury history fetch failed
    } finally {
      setHistoryLoading(false);
    }
  }

  const handleAddTransaction = async () => {
    if (!member?.settlement_id || !newTransaction.amount || !newTransaction.transactionType || !newTransaction.description.trim()) {
      toast.error('Please fill in all required fields (amount, type, and description)');
      return;
    }

    setAddingTransaction(true);

    try {
      const response = await fetch('/api/settlement/treasury/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settlementId: member.settlement_id,
          amount: parseFloat(newTransaction.amount),
          transactionType: newTransaction.transactionType,
          category: newTransaction.category || null,
          description: newTransaction.description || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add transaction');
      }

      // Reset form and close modal
      setNewTransaction({
        amount: '',
        transactionType: 'Income',
        category: '',
        description: ''
      });
      setShowAddModal(false);

      // Refresh data
      fetchSummaryData();
      fetchTransactions();

      toast.success('Transaction added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add transaction');
    } finally {
      setAddingTransaction(false);
    }
  };

  // Filter transactions by search term
  const filteredTransactions = transactions.filter(transaction =>
    (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (memberLoading || loading || !member?.settlement_id) {
    return (
      <Container>
        <div className="space-y-8 py-8">
          <div className="grid gap-6 max-w-sm">
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`transaction-skeleton-${i}`} className="flex items-center justify-between py-2">
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
            Treasury balance from the game
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}
        </div>
      </div>

      {/* Integrated Treasury Balance & History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className='text-lg font-bold'>
                  Treasury History
                </CardTitle>
                <div className="text-base font-bold mt-1">
                Balance: {summary ? formatHexcoin(summary.currentBalance) : '---'}
                </div>
              </div>
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
                  <SelectItem key="1-days" value="1-days">1 Day</SelectItem>
                  <SelectItem key="3-days" value="3-days">3 Days</SelectItem>
                  <SelectItem key="7-days" value="7-days">7 Days</SelectItem>
                  <SelectItem key="14-days" value="14-days">2 Weeks</SelectItem>
                  <SelectItem key="30-days" value="30-days">30 Days</SelectItem>
                  <SelectItem key="1-months" value="1-months">1 Month</SelectItem>
                  <SelectItem key="3-months" value="3-months">3 Months</SelectItem>
                  <SelectItem key="6-months" value="6-months">6 Months</SelectItem>
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
              <div className="h-64 rounded-lg p-4 bg-gradient-to-b from-background to-muted/20 border">
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

                    // Chart data prepared

                    // Chart configuration for ShadCN theming
                    const chartConfig: ChartConfig = {
                      balance: {
                        label: "Treasury Balance",
                        color: "#ffffff", // Clean white fill
                      },
                    };

                    return (
                      <ChartContainer config={chartConfig} className="h-full w-full">
                        <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
                          <CartesianGrid vertical={false} stroke="#374151" strokeOpacity={0.5} />
                          <XAxis 
                            dataKey={allSameDate ? "label" : "dateTime"}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            tickFormatter={(value) => {
                              if (allSameDate) {
                                return value; // Show #1, #2, #3, etc.
                              }
                              return value.split(' ')[0]; // Show date
                            }}
                          />
                          <YAxis 
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                            tickFormatter={(value) => formatCurrency(value)}
                            domain={
                              balanceRange < 100 
                                ? [balanceMin - 50, balanceMax + 50] // Tight range for small changes
                                : ['dataMin - 100', 'dataMax + 100'] // Normal range
                            }
                          />
                          <ChartTooltip 
                            cursor={false}
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
                          <Area
                            dataKey="balance"
                            type="natural"
                            fill="#ffffff"
                            fillOpacity={0.8}
                            stroke="none"
                            strokeWidth={0}
                          />
                        </AreaChart>
                      </ChartContainer>
                    );
                  })()}
                </div>
            )}
        </CardContent>
      </Card>

      {/* Manual Transaction Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Officer Ledger
              </CardTitle>
              <CardDescription>
                Log treasury transactions manually • For officer use
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
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

          </div>

          {/* Transaction List */}
          {transactionsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`transaction-skeleton-${i}`} className="flex items-center justify-between py-3 border-b">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-sm">
                {searchTerm || typeFilter !== 'all'
                  ? "Try adjusting your filters"
                  : "Start by adding your first transaction"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTransactions.map((transaction) => {
                const IconComponent = transactionTypeIcons[transaction.transactionType];
                const isPositive = transaction.transactionType === 'Income';
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/30 rounded px-2 -mx-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1.5 ${transactionTypeColors[transaction.transactionType]}`}
                      >
                        <IconComponent className="h-3 w-3" />
                        {transaction.transactionType}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">
                          {transaction.description || 'No description'}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{new Date(transaction.transactionDate).toLocaleDateString()}</span>
                          {transaction.category && (
                            <>
                              <span key={`${transaction.id}-category-sep`}>•</span>
                              <span key={`${transaction.id}-category`}>{transaction.category}</span>
                            </>
                          )}
                          {transaction.relatedProjectName && (
                            <>
                              <span key={`${transaction.id}-project-sep`}>•</span>
                              <span key={`${transaction.id}-project`}>Project: {transaction.relatedProjectName}</span>
                            </>
                          )}
                          {transaction.relatedMemberName && (
                            <>
                              <span key={`${transaction.id}-member-sep`}>•</span>
                              <span key={`${transaction.id}-member`}>Member: {transaction.relatedMemberName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : '-'}{formatHexcoin(Math.abs(transaction.amount))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={filteredTransactions.length < itemsPerPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* End focus on graph only */}
      </div>

      {/* Add Transaction Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Treasury Entry</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type *</Label>
              <Select 
                value={newTransaction.transactionType} 
                onValueChange={(value: any) => setNewTransaction(prev => ({ ...prev, transactionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Building Materials, Trade, etc."
                value={newTransaction.category}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional details about this transaction..."
                value={newTransaction.description}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddTransaction}
                disabled={addingTransaction || !newTransaction.amount || !newTransaction.transactionType}
                className="flex-1"
              >
                {addingTransaction ? 'Adding...' : 'Add Transaction'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </Container>
  );
} 