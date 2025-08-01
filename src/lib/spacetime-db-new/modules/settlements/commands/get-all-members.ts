import { createServerClient } from '../../../shared/supabase-client';

// Custom error handler for this module
function handleSupabaseError(error: any, context: string): Error {
  console.error(`Supabase error in ${context}:`, error);
  return new Error(`Database error: ${error.message || 'Unknown error'}`);
}

export interface SettlementMember {
  id: string;
  bitjitaId: string;
  name: string;
  profession: string;
  professionLevel: number;
  lastOnline: Date | null;
  joinDate: Date;
  isActive: boolean;
  lastUpdated: Date;
  createdAt: Date;
}

export interface GetAllMembersOptions {
  includeInactive?: boolean;
  profession?: string;
  limit?: number;
  offset?: number;
  settlementId?: string;
}

// Define the structure returned by the settlement_member_details view
interface SettlementMemberDetailsRow {
  settlement_id: string;
  entity_id: string;
  user_name: string;
  inventory_permission: number;
  build_permission: number;
  officer_permission: number;
  co_owner_permission: number;
  last_login_timestamp: string | null;
  joined_settlement_at: string | null;
  is_active: boolean;
  skills: Record<string, any>;
  total_skills: number;
  highest_level: number;
  total_level: number;
  total_xp: number;
  top_profession: string | null;
  is_recently_active: boolean;
  last_synced_at: string;
}

/**
 * Get all settlement members using the optimized settlement_member_details view
 */
export async function getAllMembers(options: GetAllMembersOptions = {}): Promise<SettlementMember[]> {
  // Use service role client to bypass RLS for member operations
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning empty members list');
    return [];
  }

  try {
    // Use the settlement_member_details view for combined member + citizen data
    let query = supabase
      .from('settlement_member_details')
      .select('*');

    // Apply settlement filter (this is critical!)
    if (options.settlementId) {
      query = query.eq('settlement_id', options.settlementId);
    }

    // Apply other filters
    if (!options.includeInactive) {
      query = query.eq('is_recently_active', true);
    }

    if (options.profession && options.profession !== 'all') {
      query = query.ilike('top_profession', `%${options.profession}%`);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    // Order by user_name (the view uses user_name)
    query = query.order('user_name');

    const { data, error } = await query;

    if (error) {
      throw handleSupabaseError(error, 'getting all members from settlement_member_details view');
    }

    if (!data || data.length === 0) {
      console.log(`🔍 No members found in settlement_member_details view${options.settlementId ? ` for settlement ${options.settlementId}` : ''}`);
      return [];
    }

    console.log(`✅ Found ${data.length} members in settlement_member_details view${options.settlementId ? ` for settlement ${options.settlementId}` : ''}`);

    // Map the view data to our SettlementMember interface
    return (data as SettlementMemberDetailsRow[]).map(member => ({
      id: member.entity_id, // Use entity_id as the primary identifier
      bitjitaId: member.entity_id, // entity_id is the BitJita ID
      name: member.user_name, // View uses user_name column
      profession: member.top_profession || 'Unknown', // From citizens data
      professionLevel: member.highest_level || 1, // From citizens data
      lastOnline: member.last_login_timestamp ? new Date(member.last_login_timestamp) : null,
      joinDate: member.joined_settlement_at ? new Date(member.joined_settlement_at) : new Date(),
      isActive: member.is_recently_active || false, // Use computed field from view
      lastUpdated: member.last_synced_at ? new Date(member.last_synced_at) : new Date(),
      createdAt: member.joined_settlement_at ? new Date(member.joined_settlement_at) : new Date(),
    }));

  } catch (error) {
    console.error('Error fetching settlement members from view:', error);
    throw error;
  }
} 