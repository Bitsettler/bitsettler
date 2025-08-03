/**
 * Profession utilities for handling user-selected vs calculated professions
 */

interface MemberWithProfessions {
  primary_profession?: string | null;
  secondary_profession?: string | null;
  top_profession?: string | null;
}

/**
 * Get the display profession for a member, prioritizing user choice over calculation
 */
export function getDisplayProfession(member: MemberWithProfessions): string {
  // Prioritize user-selected primary profession
  if (member.primary_profession) {
    return member.primary_profession;
  }
  
  // Fall back to calculated top profession
  if (member.top_profession) {
    return member.top_profession;
  }
  
  // Final fallback
  return 'Settler';
}

/**
 * Get the secondary profession for display (only if user has set one)
 */
export function getSecondaryProfession(member: MemberWithProfessions): string | null {
  return member.secondary_profession || null;
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