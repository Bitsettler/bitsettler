import { 
  getTreasurySummary, 
  getTreasuryStats, 
  getTreasuryTransactions, 
  getTreasuryCategories,
  type TreasurySummary, 
  type TreasuryStats, 
  type TreasuryTransaction 
} from '../commands';

export interface TreasuryDashboard {
  summary: TreasurySummary | null;
  stats: TreasuryStats;
  recentTransactions: TreasuryTransaction[];
  categories: Array<{ id: string; name: string; type: string; color: string | null }>;
  monthlyBreakdown: {
    income: Array<{ category: string; amount: number; count: number }>;
    expenses: Array<{ category: string; amount: number; count: number }>;
  };
}

/**
 * Get complete treasury dashboard data
 * Combines multiple commands to provide treasury overview
 */
export async function getTreasuryDashboard(): Promise<TreasuryDashboard> {
  try {
    // Fetch core data in parallel
    const [summary, stats, recentTransactions, categories] = await Promise.all([
      getTreasurySummary(),
      getTreasuryStats(),
      getTreasuryTransactions({ limit: 20 }), // Last 20 transactions
      getTreasuryCategories(),
    ]);

    // Calculate monthly breakdown by category
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const monthlyTransactions = await getTreasuryTransactions({
      startDate: startOfMonth,
      limit: 1000 // Get all transactions for current month
    });

    // Group by category
    const incomeByCategory = new Map<string, { amount: number; count: number }>();
    const expensesByCategory = new Map<string, { amount: number; count: number }>();

    monthlyTransactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      
      if (transaction.transactionType === 'Income') {
        const current = incomeByCategory.get(category) || { amount: 0, count: 0 };
        incomeByCategory.set(category, {
          amount: current.amount + transaction.amount,
          count: current.count + 1
        });
      } else if (transaction.transactionType === 'Expense') {
        const current = expensesByCategory.get(category) || { amount: 0, count: 0 };
        expensesByCategory.set(category, {
          amount: current.amount + transaction.amount,
          count: current.count + 1
        });
      }
    });

    // Convert to arrays and sort by amount
    const income = Array.from(incomeByCategory.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);

    const expenses = Array.from(expensesByCategory.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);

    return {
      summary,
      stats,
      recentTransactions,
      categories,
      monthlyBreakdown: {
        income,
        expenses,
      },
    };

  } catch (error) {
    console.error('Error fetching treasury dashboard:', error);
    throw new Error('Failed to load treasury dashboard');
  }
} 