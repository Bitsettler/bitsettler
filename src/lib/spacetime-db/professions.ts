import type SkillCategory from '@/data/bindings/skill_category_type'
import type { SkillDesc } from '@/data/bindings/skill_desc_type'
import skillDescData from '@/data/global/skill_desc.json'

// Extended profession interface that adds UI-specific properties to SkillDesc
export interface Profession extends Omit<SkillDesc, 'skillCategory'> {
  skillCategory: SkillCategory
  color: string
  description: string
  actualIconPath: string
  slug: string
}

// Color mapping for different skill types
const SKILL_COLORS: Record<string, string> = {
  Forestry: 'bg-green-100 border-green-200 text-green-800',
  Carpentry: 'bg-amber-100 border-amber-200 text-amber-800',
  Masonry: 'bg-gray-100 border-gray-200 text-gray-800',
  Mining: 'bg-slate-100 border-slate-200 text-slate-800',
  Smithing: 'bg-red-100 border-red-200 text-red-800',
  Scholar: 'bg-indigo-100 border-indigo-200 text-indigo-800',
  Leatherworking: 'bg-brown-100 border-brown-200 text-brown-800',
  Hunting: 'bg-red-100 border-red-200 text-red-800',
  Tailoring: 'bg-purple-100 border-purple-200 text-purple-800',
  Farming: 'bg-emerald-100 border-emerald-200 text-emerald-800',
  Fishing: 'bg-blue-100 border-blue-200 text-blue-800',
  Cooking: 'bg-orange-100 border-orange-200 text-orange-800',
  Foraging: 'bg-teal-100 border-teal-200 text-teal-800',
  Construction: 'bg-stone-100 border-stone-200 text-stone-800',
  Taming: 'bg-pink-100 border-pink-200 text-pink-800',
  Slayer: 'bg-red-100 border-red-200 text-red-800',
  Merchanting: 'bg-yellow-100 border-yellow-200 text-yellow-800',
  Sailing: 'bg-cyan-100 border-cyan-200 text-cyan-800'
}

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
  Sailing: 'SkillIconExploration' // Sailing uses Exploration icon as fallback
}

// Skill descriptions mapping (since the data doesn't include descriptions yet)
const SKILL_DESCRIPTIONS: Record<string, string> = {
  Forestry: 'Harvest wood and manage forest resources',
  Carpentry: 'Craft wooden structures, furniture, and tools',
  Masonry: 'Build with stone, brick, and other durable materials',
  Mining: 'Extract valuable ores and minerals from the earth',
  Smithing: 'Forge metal tools, weapons, and equipment',
  Scholar: 'Research and discover ancient knowledge and artifacts',
  Leatherworking: 'Work with leather to create armor and accessories',
  Hunting: 'Track and hunt creatures for resources',
  Tailoring: 'Create clothing, fabric, and textile goods',
  Farming: 'Grow crops and manage agricultural resources',
  Fishing: 'Catch fish and aquatic resources',
  Cooking: 'Prepare nutritious meals and consumables',
  Foraging: 'Gather natural resources and wild ingredients',
  Construction: 'Build large structures and architectural marvels',
  Taming: 'Befriend and train wild creatures as companions',
  Slayer: 'Combat dangerous monsters and creatures',
  Merchanting: 'Master the art of commerce and negotiation',
  Sailing: 'Navigate the seas and explore distant waters'
}

// Create URL-friendly slug from profession name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Convert skill category array format to SkillCategory type
function convertSkillCategory(skillCategory: [number, any]): SkillCategory {
  const categoryType = skillCategory[0]
  switch (categoryType) {
    case 0:
      return { tag: 'None' }
    case 1:
      return { tag: 'Profession' }
    case 2:
      return { tag: 'Adventure' }
    default:
      return { tag: 'None' }
  }
}

// Convert raw skill data to SkillDesc format and then to Profession
function convertSkillToProfession(skill: any): Profession {
  // First convert to SkillDesc format (matching the generated type)
  const skillDesc: SkillDesc = {
    id: skill.id,
    skillType: skill.skill_type,
    name: skill.name,
    description: skill.description || '', // Use existing description if available
    iconAssetName: skill.icon_asset_name,
    title: skill.title || skill.name,
    skillCategory: convertSkillCategory(skill.skill_category),
    maxLevel: skill.max_level
  }

  // Then extend with UI-specific properties
  return {
    ...skillDesc,
    color: SKILL_COLORS[skill.name] || 'bg-gray-100 border-gray-200 text-gray-800',
    description: skill.description || SKILL_DESCRIPTIONS[skill.name] || '',
    actualIconPath: SKILL_ICON_MAPPING[skill.name] || 'SkillIconAny',
    slug: createSlug(skill.name)
  }
}

// Get all professions from skill data (excluding ANY skill)
export function getAllProfessions(): Profession[] {
  return skillDescData
    .filter((skill: any) => skill.name !== 'ANY') // Exclude the ANY skill
    .map(convertSkillToProfession)
}

// Utility functions for professions
export function getProfessionsByCategory(category: SkillCategory): Profession[] {
  return getAllProfessions().filter((profession) => profession.skillCategory.tag === category.tag)
}

export function getProfessionById(id: number): Profession | undefined {
  return getAllProfessions().find((profession) => profession.id === id)
}

export function getProfessionBySlug(slug: string): Profession | undefined {
  return getAllProfessions().find((profession) => profession.slug === slug)
}

export function getProfessionsByType(type: 'Profession' | 'Adventure' | 'None'): Profession[] {
  return getAllProfessions().filter((profession) => profession.skillCategory.tag === type)
}

export function getProfessionStats() {
  const professions = getAllProfessions()
  const professionCount = professions.filter((p) => p.skillCategory.tag === 'Profession').length
  const adventureCount = professions.filter((p) => p.skillCategory.tag === 'Adventure').length
  const noneCount = professions.filter((p) => p.skillCategory.tag === 'None').length

  return {
    total: professions.length,
    profession: professionCount,
    adventure: adventureCount,
    none: noneCount
  }
}
