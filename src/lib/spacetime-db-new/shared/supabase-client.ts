import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging to see what we're getting
console.log('🔍 Environment Variables Debug:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
console.log('  URL starts with https:', supabaseUrl?.startsWith('https://') ? '✅ Yes' : '❌ No');

// Only warn once in development
let hasWarnedAboutSupabase = false;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development' && !hasWarnedAboutSupabase) {
    console.info('ℹ️  Settlement features running in demo mode (Supabase not configured)');
    console.info('   To enable full features, add Supabase credentials to .env.local');
    hasWarnedAboutSupabase = true;
  }
}

// Create Supabase client (null if credentials missing)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

console.log('🔍 Supabase Client:', supabase ? '✅ Created successfully' : '❌ Failed to create');

// Server-side client with service role key (for admin operations)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    // Don't warn about service role in demo mode
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Type definitions for database tables
export interface Database {
  public: {
    Tables: {
      settlement_members: {
        Row: {
          id: string;
          bitjita_id: string | null;
          name: string;
          profession: string;
          profession_level: number;
          last_online: string | null;
          join_date: string;
          is_active: boolean;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bitjita_id?: string | null;
          name: string;
          profession: string;
          profession_level?: number;
          last_online?: string | null;
          join_date?: string;
          is_active?: boolean;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          bitjita_id?: string | null;
          name?: string;
          profession?: string;
          profession_level?: number;
          last_online?: string | null;
          join_date?: string;
          is_active?: boolean;
          last_updated?: string;
          created_at?: string;
        };
      };
      member_professions: {
        Row: {
          id: string;
          member_id: string;
          profession: string;
          level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          profession: string;
          level: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          profession?: string;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      settlement_projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: 'Active' | 'Completed' | 'Cancelled';
          priority: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: 'Active' | 'Completed' | 'Cancelled';
          priority?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: 'Active' | 'Completed' | 'Cancelled';
          priority?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_items: {
        Row: {
          id: string;
          project_id: string;
          item_name: string;
          required_quantity: number;
          current_quantity: number;
          tier: number;
          priority: number;
          rank_order: number;
          status: 'Needed' | 'In Progress' | 'Completed';
          assigned_member_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          item_name: string;
          required_quantity: number;
          current_quantity?: number;
          tier?: number;
          priority?: number;
          rank_order?: number;
          status?: 'Needed' | 'In Progress' | 'Completed';
          assigned_member_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          item_name?: string;
          required_quantity?: number;
          current_quantity?: number;
          tier?: number;
          priority?: number;
          rank_order?: number;
          status?: 'Needed' | 'In Progress' | 'Completed';
          assigned_member_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      treasury_transactions: {
        Row: {
          id: string;
          transaction_type: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
          amount: number;
          category: string | null;
          subcategory: string | null;
          description: string;
          related_project_id: string | null;
          related_member_id: string | null;
          source: string | null;
          is_recurring: boolean;
          recurring_frequency: string | null;
          transaction_date: string;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_type: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
          amount: number;
          category?: string | null;
          subcategory?: string | null;
          description: string;
          related_project_id?: string | null;
          related_member_id?: string | null;
          source?: string | null;
          is_recurring?: boolean;
          recurring_frequency?: string | null;
          transaction_date?: string;
          recorded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_type?: 'Income' | 'Expense' | 'Transfer' | 'Adjustment';
          amount?: number;
          category?: string | null;
          subcategory?: string | null;
          description?: string;
          related_project_id?: string | null;
          related_member_id?: string | null;
          source?: string | null;
          is_recurring?: boolean;
          recurring_frequency?: string | null;
          transaction_date?: string;
          recorded_at?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Helper function to check if Supabase is available
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

// Error handling helper
export function handleSupabaseError(error: { message?: string; code?: string; details?: string; hint?: string }, operation: string): Error {
  console.error(`Supabase error during ${operation}:`, error);
  return new Error(`Database operation failed: ${operation}`);
} 