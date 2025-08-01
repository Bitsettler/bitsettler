import { createServerClient } from '../../../shared/supabase-client';

export interface SettlementInfo {
  id: string;
  settlementId: string;
  settlementName: string;
  isActive: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettlementStats {
  totalMembers: number;
  activeMembers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
}

/**
 * Get settlement configuration information
 */
export async function getSettlementInfo(settlementId?: string): Promise<SettlementInfo | null> {
  // Use service role client to bypass RLS for settlement operations
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning null');
    return null;
  }

  try {
    let query = supabase
      .from('settlement_config')
      .select('*');

    if (settlementId) {
      query = query.eq('settlement_id', settlementId);
    } else {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Settlement not found
      }
      throw handleSupabaseError(error, 'getting settlement info');
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      settlementId: data.settlement_id,
      settlementName: data.settlement_name,
      isActive: data.is_active,
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

  } catch (error) {
    console.error('Error fetching settlement info:', error);
    throw error;
  }
}

/**
 * Get settlement statistics
 */
export async function getSettlementStats(): Promise<SettlementStats> {
  // Use service role client to bypass RLS for settlement operations
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning empty stats');
    return {
      totalMembers: 0,
      activeMembers: 0,
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
    };
  }

  try {
    // Get member counts
    const { count: totalMembers } = await supabase
      .from('settlement_members')
      .select('*', { count: 'exact', head: true });

    const { count: activeMembers } = await supabase
      .from('settlement_members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get project counts
    const { count: totalProjects } = await supabase
      .from('settlement_projects')
      .select('*', { count: 'exact', head: true });

    const { count: activeProjects } = await supabase
      .from('settlement_projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active');

    const { count: completedProjects } = await supabase
      .from('settlement_projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Completed');

    return {
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      totalProjects: totalProjects || 0,
      activeProjects: activeProjects || 0,
      completedProjects: completedProjects || 0,
    };

  } catch (error) {
    console.error('Error fetching settlement stats:', error);
    throw error;
  }
} 