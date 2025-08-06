import { createServerClient, handleSupabaseError } from '../../../shared/supabase-client';
import { SettlementMember } from './get-all-members';

export interface MemberProfession {
  id: string;
  profession: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberWithSkills extends SettlementMember {
  professions: MemberProfession[];
}

/**
 * Get a settlement member by player entity ID (BitJita character ID) with their professions/skills
 * @param memberId - BitJita player_entity_id (numeric string like "504403158277830330")
 */
export async function getMemberById(memberId: string): Promise<MemberWithSkills | null> {
  // Use service role client to bypass RLS for member operations
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase service role client not available, returning null');
    return null;
  }

  try {
    // Get member details using player_entity_id (BitJita character ID)
    const { data: memberData, error: memberError } = await supabase
      .from('settlement_members')
      .select('*')
      .eq('player_entity_id', memberId)
      .single();

    if (memberError) {
      if (memberError.code === 'PGRST116') {
        return null; // Member not found
      }
      throw handleSupabaseError(memberError, 'getting member by ID');
    }

    if (!memberData) {
      return null;
    }

    // Get member professions using the UUID member.id (not the BitJita player_entity_id)
    const { data: professionsData, error: professionsError } = await supabase
      .from('member_professions')
      .select('*')
      .eq('member_id', memberData.id)  // Use UUID id, not BitJita player_entity_id
      .order('level', { ascending: false });

    if (professionsError) {
      throw handleSupabaseError(professionsError, 'getting member professions');
    }

    const member: SettlementMember = {
      id: memberData.id,
      bitjitaId: memberData.bitjita_id,
      name: memberData.name,
      profession: memberData.profession,
      professionLevel: memberData.profession_level,
      lastOnline: memberData.last_online ? new Date(memberData.last_online) : null,
      joinDate: new Date(memberData.join_date),
      isActive: memberData.is_active,
      lastUpdated: new Date(memberData.last_updated),
      createdAt: new Date(memberData.created_at),
    };

    const professions: MemberProfession[] = (professionsData || []).map(prof => ({
      id: prof.id,
      profession: prof.profession,
      level: prof.level,
      createdAt: new Date(prof.created_at),
      updatedAt: new Date(prof.updated_at),
    }));

    return {
      ...member,
      professions,
    };

  } catch (error) {
    console.error('Error fetching member by ID:', error);
    throw error;
  }
} 