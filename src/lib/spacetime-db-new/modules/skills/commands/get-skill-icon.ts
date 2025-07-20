import type { SkillDesc } from '@/data/bindings/skill_desc_type'

// Skill icon mapping (since iconAssetName contains Unicode characters, not file names)
const SKILL_ICON_MAPPING: Record<string, string> = {
  Forestry: 'SkillIconForestry',
  Carpentry: 'SkillIconCarpentry',
  Masonry: 'SkillIconMasonry',
  Mining: 'SkillIconMining',
  Smithing: 'SkillIconSmithing',
  Scholar: 'SkillIconArtificing', // Scholar uses Artificing icon
  Leatherworking: 'SkillIconLeatherworking',
  Hunting: 'SkillIconHunting',
  Tailoring: 'SkillIconTailoring',
  Farming: 'SkillIconFarming',
  Fishing: 'SkillIconFishing',
  Cooking: 'SkillIconCooking',
  Foraging: 'SkillIconForaging',
  Construction: 'SkillIconCarpentry', // Construction uses Carpentry icon as fallback
  Taming: 'SkillIconHunting', // Taming uses Hunting icon as fallback
  Slayer: 'SkillIconCombat',
  Merchanting: 'SkillIconTrading',
  Sailing: 'SkillIconExploration', // Sailing uses Exploration icon as fallback
  ANY: 'SkillIconAny' // For the ANY skill
}

// Enhanced skill interface with proper icon path
export interface SkillWithIcon extends SkillDesc {
  actualIconPath: string
}

/**
 * Get the proper icon asset name for a skill
 */
export function getSkillIconPath(skillName: string): string {
  return `/assets/Skill/${SKILL_ICON_MAPPING[skillName] || 'SkillIconAny'}.webp`
}

/**
 * Add proper icon paths to an array of skills
 */
export function getSkillsWithIcons(skills: SkillDesc[]): SkillWithIcon[] {
  return skills.map(
    (skill): SkillWithIcon => ({
      ...skill,
      actualIconPath: getSkillIconPath(skill.name)
    })
  )
}
