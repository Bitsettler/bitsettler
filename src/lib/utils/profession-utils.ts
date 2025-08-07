/**
 * Profession utilities for handling user-selected vs calculated professions
 */

interface MemberWithProfessions {
  primary_profession?: string | null;
  secondary_profession?: string | null;
  top_profession?: string | null;
}

/**
 * Map numerical profession IDs from BitJita to human-readable names
 */
function mapProfessionId(professionId: string | null): string | null {
  if (!professionId) return null;
  
  // If it's already a string (user-set profession), return as-is
  if (isNaN(Number(professionId))) {
    return professionId;
  }
  
  // Map numerical IDs to profession names based on BitJita's system
  const professionMap: Record<string, string> = {
    '1': 'Farming',
    '2': 'Mining', 
    '3': 'Logging',
    '4': 'Building',
    '5': 'Smithing',
    '6': 'Cooking',
    '7': 'Tailoring',
    '8': 'Alchemy',
    '9': 'Trading',
    '10': 'Hunting',
    '11': 'Survival',
    '12': 'Leatherworking',
    '13': 'Masonry'
  };
  
  return professionMap[professionId] || 'Unknown';
}

/**
 * Get the display profession for a member, prioritizing user choice over calculation
 */
export function getDisplayProfession(member: MemberWithProfessions): string {
  // Prioritize user-selected primary profession
  if (member.primary_profession) {
    return mapProfessionId(member.primary_profession) || member.primary_profession;
  }
  
  // Fall back to calculated top profession (convert numerical IDs)
  if (member.top_profession) {
    return mapProfessionId(member.top_profession) || 'Settler';
  }
  
  // Final fallback
  return 'Settler';
}

/**
 * Get the secondary profession for display (only if user has set one)
 */
export function getSecondaryProfession(member: MemberWithProfessions): string | null {
  if (!member.secondary_profession) return null;
  return mapProfessionId(member.secondary_profession) || member.secondary_profession;
}

/**
 * Get formatted profession display string
 */
export function getFormattedProfessionDisplay(member: MemberWithProfessions): string {
  const primary = getDisplayProfession(member);
  const secondary = getSecondaryProfession(member);
  
  if (secondary) {
    return `${primary} / ${secondary}`;
  }
  
  return primary;
}

/**
 * Check if member has custom profession settings
 */
export function hasCustomProfessions(member: MemberWithProfessions): boolean {
  return !!(member.primary_profession || member.secondary_profession);
}

/**
 * Get profession source indicator for UI
 */
export function getProfessionSource(member: MemberWithProfessions): 'user-selected' | 'calculated' {
  return member.primary_profession ? 'user-selected' : 'calculated';
}