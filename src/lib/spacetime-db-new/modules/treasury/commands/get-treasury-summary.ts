import { supabase, isSupabaseAvailable, handleSupabaseError } from '../../../shared/supabase-client';

export interface TreasurySummary {
  id: string;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  lastTransactionDate: Date | null;
  lastUpdated: Date;
  createdAt: Date;
}

export interface TreasuryStats {
  monthlyIncome: number;
  monthlyExpenses: number;
  netChange: number;
  transactionCount: number;
  averageTransactionSize: number;
}

/**
 * Get current treasury summary
 */
export async function getTreasurySummary(): Promise<TreasurySummary | null> {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, returning null');
    return null;
  }

  try {
    const { data, error } = await supabase!
      .from('treasury_summary')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No treasury data yet
      }
      throw handleSupabaseError(error, 'getting treasury summary');
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      currentBalance: parseFloat(data.current_balance),
      totalIncome: parseFloat(data.total_income),
      totalExpenses: parseFloat(data.total_expenses),
      lastTransactionDate: data.last_transaction_date ? new Date(data.last_transaction_date) : null,
      lastUpdated: new Date(data.last_updated),
      createdAt: new Date(data.created_at),
    };

  } catch (error) {
    console.error('Error fetching treasury summary:', error);
    throw error;
  }
}

/**
 * Get treasury statistics for current month
 */
export async function getTreasuryStats(): Promise<TreasuryStats> {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, returning empty stats');
    return {
      monthlyIncome: 0,
      monthlyExpenses: 0,
      netChange: 0,
      transactionCount: 0,
      averageTransactionSize: 0,
    };
  }

  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Get current month's data (for potential future use)
    const { error: monthlyError } = await supabase!
      .from('treasury_monthly_summary')
      .select('*')
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .single();

    if (monthlyError && monthlyError.code !== 'PGRST116') {
      throw handleSupabaseError(monthlyError, 'getting monthly treasury stats');
    }

    // Get recent transactions for additional stats
    const { data: recentTransactions, error: transactionsError } = await supabase!
      .from('treasury_transactions')
      .select('amount, transaction_type')
      .gte('transaction_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

    if (transactionsError) {
      throw handleSupabaseError(transactionsError, 'getting recent transactions');
    }

    const transactions = recentTransactions || [];
    const incomeTransactions = transactions.filter(t => t.transaction_type === 'Income');
    const expenseTransactions = transactions.filter(t => t.transaction_type === 'Expense');

    const monthlyIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const monthlyExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const transactionCount = transactions.length;
    const averageTransactionSize = transactionCount > 0 
      ? transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) / transactionCount 
      : 0;

    return {
      monthlyIncome,
      monthlyExpenses,
      netChange: monthlyIncome - monthlyExpenses,
      transactionCount,
      averageTransactionSize,
    };

  } catch (error) {
    console.error('Error fetching treasury stats:', error);
    throw error;
  }
} 