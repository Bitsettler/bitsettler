import { supabase, isSupabaseAvailable, handleSupabaseError } from '../../../shared/supabase-client';

export interface SettlementMember {
  id: string;
  bitjitaId: string | null;
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
}

/**
 * Get all settlement members
 */
export async function getAllMembers(options: GetAllMembersOptions = {}): Promise<SettlementMember[]> {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, returning empty members list');
    return [];
  }

  try {
    let query = supabase!
      .from('settlement_members')
      .select('*');

    // Apply filters
    if (!options.includeInactive) {
      query = query.eq('is_active', true);
    }

    if (options.profession) {
      query = query.eq('profession', options.profession);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    // Order by name
    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw handleSupabaseError(error, 'getting all members');
    }

    return (data || []).map(member => ({
      id: member.id,
      bitjitaId: member.bitjita_id,
      name: member.name,
      profession: member.profession,
      professionLevel: member.profession_level,
      lastOnline: member.last_online ? new Date(member.last_online) : null,
      joinDate: new Date(member.join_date),
      isActive: member.is_active,
      lastUpdated: new Date(member.last_updated),
      createdAt: new Date(member.created_at),
    }));

  } catch (error) {
    console.error('Error fetching settlement members:', error);
    throw error;
  }
} 