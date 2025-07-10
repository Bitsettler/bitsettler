import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { CompendiumEntity } from './types'

/**
 * Filter entities to only include items
 */
export function filterToItems(entities: CompendiumEntity[]): ItemDesc[] {
  return entities.filter((entity) => entity.entityType === 'item').map((entity) => entity as ItemDesc)
}

/**
 * Filter items by weapon type
 */
export function filterWeapons(items: ItemDesc[]): ItemDesc[] {
  return items.filter((item) => item.tag === 'Weapon')
}

/**
 * Filter items by armor type
 */
export function filterArmor(items: ItemDesc[]): ItemDesc[] {
  const armorTags = ['Metal Armor', 'Leather Armor', 'Cloth Armor']
  return items.filter((item) => armorTags.includes(item.tag))
}

/**
 * Filter items by clothing type
 */
export function filterClothing(items: ItemDesc[]): ItemDesc[] {
  const clothingTags = ['Leather Clothing', 'Cloth Clothing']
  return items.filter((item) => clothingTags.includes(item.tag))
}

/**
 * Filter items by tool type
 */
export function filterTools(items: ItemDesc[]): ItemDesc[] {
  const toolTags = [
    'Carpentry Tool',
    'Masonry Tool',
    'Smithing Tool',
    'Tailor Tool',
    'Leatherworking Tool',
    'Alchemy Tool',
    'Cooking Tool',
    'Farming Tool'
  ]
  return items.filter((item) => toolTags.includes(item.tag))
}

/**
 * Filter items by consumable type
 */
export function filterConsumables(items: ItemDesc[]): ItemDesc[] {
  const consumableTags = ['Food', 'Potion', 'Scroll']
  return items.filter((item) => consumableTags.includes(item.tag))
}

/**
 * Filter items by material type
 */
export function filterMaterials(items: ItemDesc[]): ItemDesc[] {
  const materialTags = [
    'Metal',
    'Stone',
    'Wood',
    'Cloth',
    'Leather',
    'Bone',
    'Gem',
    'Herb',
    'Fiber',
    'Resin',
    'Oil',
    'Dye'
  ]
  return items.filter((item) => materialTags.includes(item.tag))
}

/**
 * Get item statistics by category
 */
export function getItemStatsByCategory(items: ItemDesc[]): Record<string, number> {
  const stats: Record<string, number> = {}

  items.forEach((item) => {
    const category = item.tag || 'Uncategorized'
    stats[category] = (stats[category] || 0) + 1
  })

  return stats
}

/**
 * Check if item is craftable (has recipes)
 */
export function isCraftable(item: ItemDesc): boolean {
  // This would need to be implemented with recipe data
  // For now, return true as placeholder
  return true
}

/**
 * Get tier distribution for items
 */
export function getItemTierDistribution(items: ItemDesc[]): Record<number, number> {
  const distribution: Record<number, number> = {}

  items.forEach((item) => {
    distribution[item.tier] = (distribution[item.tier] || 0) + 1
  })

  return distribution
}
