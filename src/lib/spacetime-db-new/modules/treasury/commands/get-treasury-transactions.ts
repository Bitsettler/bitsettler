import { createServerClient } from '../../../shared/supabase-client';

export interface TreasuryTransaction {
  id: string;
  transactionType: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
  amount: number;
  category: string | null;
  subcategory: string | null;
  description: string;
  relatedProjectId: string | null;
  relatedMemberId: string | null;
  source: string | null;
  isRecurring: boolean;
  recurringFrequency: string | null;
  transactionDate: Date;
  recordedAt: Date;
  createdAt: Date;
}

export interface TreasuryTransactionWithDetails extends TreasuryTransaction {
  relatedProjectName?: string;
  relatedMemberName?: string;
}

export interface GetTransactionsOptions {
  type?: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
  category?: string;
  startDate?: Date;
  endDate?: Date;
  relatedProjectId?: string;
  relatedMemberId?: string;
  limit?: number;
  offset?: number;
  includeDetails?: boolean;
}

/**
 * Get treasury transactions with filtering and pagination
 */
export async function getTreasuryTransactions(options: GetTransactionsOptions = {}): Promise<TreasuryTransaction[]> {
  // Use service role client to bypass RLS for treasury operations
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning empty transactions list');
    return [];
  }

  try {
    let query = supabase
      .from('treasury_transactions')
      .select('*');

    // Apply filters
    if (options.type) {
      query = query.eq('transaction_type', options.type);
    }

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.startDate) {
      query = query.gte('transaction_date', options.startDate.toISOString().split('T')[0]);
    }

    if (options.endDate) {
      query = query.lte('transaction_date', options.endDate.toISOString().split('T')[0]);
    }

    if (options.relatedProjectId) {
      query = query.eq('related_project_id', options.relatedProjectId);
    }

    if (options.relatedMemberId) {
      query = query.eq('related_member_id', options.relatedMemberId);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    // Order by transaction date (newest first)
    query = query.order('transaction_date', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw handleSupabaseError(error, 'getting treasury transactions');
    }

    return (data || []).map(transaction => ({
      id: transaction.id,
      transactionType: transaction.transaction_type,
      amount: parseFloat(transaction.amount),
      category: transaction.category,
      subcategory: transaction.subcategory,
      description: transaction.description,
      relatedProjectId: transaction.related_project_id,
      relatedMemberId: transaction.related_member_id,
      source: transaction.source,
      isRecurring: transaction.is_recurring,
      recurringFrequency: transaction.recurring_frequency,
      transactionDate: new Date(transaction.transaction_date),
      recordedAt: new Date(transaction.recorded_at),
      createdAt: new Date(transaction.created_at),
    }));

  } catch (error) {
    console.error('Error fetching treasury transactions:', error);
    throw error;
  }
}

/**
 * Get treasury transactions with related project and member details
 */
export async function getTreasuryTransactionsWithDetails(options: GetTransactionsOptions = {}): Promise<TreasuryTransactionWithDetails[]> {
  // Use service role client to bypass RLS for treasury operations
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning empty transactions list');
    return [];
  }

  try {
    let query = supabase
      .from('treasury_transactions')
      .select(`
        *,
        settlement_projects!left(name),
        settlement_members!left(name)
      `);

    // Apply same filters as basic query
    if (options.type) {
      query = query.eq('transaction_type', options.type);
    }

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.startDate) {
      query = query.gte('transaction_date', options.startDate.toISOString().split('T')[0]);
    }

    if (options.endDate) {
      query = query.lte('transaction_date', options.endDate.toISOString().split('T')[0]);
    }

    if (options.relatedProjectId) {
      query = query.eq('related_project_id', options.relatedProjectId);
    }

    if (options.relatedMemberId) {
      query = query.eq('related_member_id', options.relatedMemberId);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    // Order by transaction date (newest first)
    query = query.order('transaction_date', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw handleSupabaseError(error, 'getting treasury transactions with details');
    }

    return (data || []).map(transaction => ({
      id: transaction.id,
      transactionType: transaction.transaction_type,
      amount: parseFloat(transaction.amount),
      category: transaction.category,
      subcategory: transaction.subcategory,
      description: transaction.description,
      relatedProjectId: transaction.related_project_id,
      relatedMemberId: transaction.related_member_id,
      source: transaction.source,
      isRecurring: transaction.is_recurring,
      recurringFrequency: transaction.recurring_frequency,
      transactionDate: new Date(transaction.transaction_date),
      recordedAt: new Date(transaction.recorded_at),
      createdAt: new Date(transaction.created_at),
      relatedProjectName: (transaction.settlement_projects as any)?.name || undefined,
      relatedMemberName: (transaction.settlement_members as any)?.name || undefined,
    }));

  } catch (error) {
    console.error('Error fetching treasury transactions with details:', error);
    throw error;
  }
}

/**
 * Get treasury categories for filtering
 */
export async function getTreasuryCategories(): Promise<Array<{ id: string; name: string; type: string; color: string | null }>> {
  // Use service role client to bypass RLS for treasury operations
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning empty categories list');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('treasury_categories')
      .select('id, name, type, color')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw handleSupabaseError(error, 'getting treasury categories');
    }

    return data || [];

  } catch (error) {
    console.error('Error fetching treasury categories:', error);
    throw error;
  }
} 