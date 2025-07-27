import { supabase, isSupabaseAvailable, handleSupabaseError } from '../../../shared/supabase-client';
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
 * Get a settlement member by ID with their professions/skills
 */
export async function getMemberById(memberId: string): Promise<MemberWithSkills | null> {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, returning null');
    return null;
  }

  try {
    // Get member details
    const { data: memberData, error: memberError } = await supabase!
      .from('settlement_members')
      .select('*')
      .eq('id', memberId)
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

    // Get member professions
    const { data: professionsData, error: professionsError } = await supabase!
      .from('member_professions')
      .select('*')
      .eq('member_id', memberId)
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