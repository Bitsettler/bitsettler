'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Search, Filter, TrendingUp, TrendingDown, Wallet, Calendar, ArrowUpRight, ArrowDownRight, Plus, Minus, RefreshCw } from 'lucide-react';

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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SettlementTreasuryView() {
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, currentPage]);

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

  // Filter transactions by search term
  const filteredTransactions = transactions.filter(transaction =>
    (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-8">
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
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Failed to load treasury</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchSummaryData} variant="outline" className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settlement Treasury</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your settlement's financial health and transaction history.
          </p>
        </div>
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.currentBalance) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.lastTransactionDate ? 
                `Last updated ${new Date(summary.lastTransactionDate).toLocaleDateString()}` :
                'No transactions yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats ? formatCurrency(stats.monthlyIncome) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats ? formatCurrency(stats.monthlyExpenses) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats && stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats ? (stats.netChange >= 0 ? '+' : '') + formatCurrency(stats.netChange) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? `${stats.transactionCount} transactions` : 'No transactions'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Recent treasury transactions and financial activity
          </CardDescription>
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
                  <p>Treasury transactions will appear here when they're recorded.</p>
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
  );
} 