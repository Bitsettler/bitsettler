import type { ItemDesc } from '@/data/bindings/item_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import { tagCollections } from '@/lib/spacetime-db/item-tag-collections'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Combined consumable data with computed properties
export interface ConsumableWithItem extends ItemDesc {
  consumableCategory: string
  isFood: boolean
  isPotion: boolean
  isBait: boolean
  isCraftingResource: boolean
  nutritionValue: string
  effectType: string
}

/**
 * Get consumable-related data from static JSON files
 */
function getConsumableData() {
  return {
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData)
  }
}

/**
 * Get consumable category based on tag
 */
function getConsumableCategory(tag: string): string {
  const categoryMapping: Record<string, string> = {
    'Basic Food': 'Food & Nutrition',
    Meal: 'Food & Nutrition',
    'Raw Meal': 'Food & Nutrition',
    Berry: 'Food & Nutrition',
    'Citric Berry': 'Food & Nutrition',
    Mushroom: 'Food & Nutrition',
    Sugar: 'Food & Nutrition',
    Tea: 'Food & Nutrition',
    Vegetable: 'Food & Nutrition',
    'Wonder Fruit': 'Food & Nutrition',
    'Healing Potion': 'Potions & Medicine',
    'Stamina Potion': 'Potions & Medicine',
    'Crafting Speed Elixir': 'Potions & Medicine',
    Bandage: 'Potions & Medicine',
    Bait: 'Fishing Supplies',
    Chum: 'Fishing Supplies',
    Recipe: 'Crafting & Recipes'
  }

  return categoryMapping[tag] || 'Other Consumables'
}

/**
 * Get nutrition value description based on tag
 */
function getNutritionValue(tag: string): string {
  const nutritionMapping: Record<string, string> = {
    'Basic Food': 'Low',
    Meal: 'High',
    'Raw Meal': 'Medium',
    Berry: 'Low',
    'Citric Berry': 'Medium',
    Mushroom: 'Low',
    Sugar: 'Low',
    Tea: 'Low',
    Vegetable: 'Medium',
    'Wonder Fruit': 'High'
  }

  return nutritionMapping[tag] || 'None'
}

/**
 * Get effect type description based on tag
 */
function getEffectType(tag: string): string {
  const effectMapping: Record<string, string> = {
    'Basic Food': 'Satiation',
    Meal: 'Satiation',
    'Raw Meal': 'Satiation',
    Berry: 'Satiation',
    'Citric Berry': 'Satiation',
    Mushroom: 'Satiation',
    Sugar: 'Satiation',
    Tea: 'Satiation + Buffs',
    Vegetable: 'Satiation',
    'Wonder Fruit': 'Satiation + Special',
    'Healing Potion': 'Health Restoration',
    'Stamina Potion': 'Stamina Restoration',
    'Crafting Speed Elixir': 'Crafting Boost',
    Bandage: 'Health Restoration',
    Bait: 'Fishing Enhancement',
    Chum: 'Fishing Enhancement',
    Recipe: 'Knowledge'
  }

  return effectMapping[tag] || 'Unknown'
}

/**
 * Check if item is food-related
 */
function isFoodType(tag: string): boolean {
  const foodTags = [
    'Basic Food',
    'Meal',
    'Raw Meal',
    'Berry',
    'Citric Berry',
    'Mushroom',
    'Sugar',
    'Tea',
    'Vegetable',
    'Wonder Fruit'
  ]
  return foodTags.includes(tag)
}

/**
 * Check if item is potion-related
 */
function isPotionType(tag: string): boolean {
  const potionTags = ['Healing Potion', 'Stamina Potion', 'Crafting Speed Elixir', 'Bandage']
  return potionTags.includes(tag)
}

/**
 * Check if item is bait-related
 */
function isBaitType(tag: string): boolean {
  const baitTags = ['Bait', 'Chum']
  return baitTags.includes(tag)
}

/**
 * Check if item is crafting resource
 */
function isCraftingResourceType(tag: string): boolean {
  const craftingTags = ['Recipe', 'Sugar']
  return craftingTags.includes(tag)
}

/**
 * Get all consumable items from static data
 */
export async function getConsumableItems(): Promise<ItemDesc[]> {
  const { itemDesc } = getConsumableData()
  const consumableTags = new Set(tagCollections.consumables.tags)

  return itemDesc.filter(
    (item) =>
      item.compendiumEntry && consumableTags.has(item.tag as unknown as (typeof tagCollections.consumables.tags)[0])
  )
}

/**
 * Get consumables with computed properties and enriched data
 */
export async function getConsumablesWithStats(): Promise<ConsumableWithItem[]> {
  const { itemDesc } = getConsumableData()
  const consumableTags = new Set(tagCollections.consumables.tags)

  const consumableItems = itemDesc.filter(
    (item) =>
      item.compendiumEntry && consumableTags.has(item.tag as unknown as (typeof tagCollections.consumables.tags)[0])
  )

  const results: ConsumableWithItem[] = []

  for (const item of consumableItems) {
    // Calculate computed properties
    const consumableCategory = getConsumableCategory(item.tag)
    const isFood = isFoodType(item.tag)
    const isPotion = isPotionType(item.tag)
    const isBait = isBaitType(item.tag)
    const isCraftingResource = isCraftingResourceType(item.tag)
    const nutritionValue = getNutritionValue(item.tag)
    const effectType = getEffectType(item.tag)

    results.push({
      ...item,
      consumableCategory,
      isFood,
      isPotion,
      isBait,
      isCraftingResource,
      nutritionValue,
      effectType
    })
  }

  return results
}

/**
 * Alias for consistency with other modules
 */
export async function getConsumablesWithItems(): Promise<ConsumableWithItem[]> {
  return getConsumablesWithStats()
}

/**
 * Get consumables grouped by tag, sorted by tier then by name
 */
export async function getConsumablesGroupedByTag(): Promise<Record<string, ConsumableWithItem[]>> {
  const consumables = await getConsumablesWithStats()

  const grouped: Record<string, ConsumableWithItem[]> = {}

  for (const consumable of consumables) {
    const tag = consumable.tag
    if (!grouped[tag]) {
      grouped[tag] = []
    }
    grouped[tag].push(consumable)
  }

  // Sort each group by tier, then by name
  for (const tag in grouped) {
    grouped[tag].sort((a, b) => {
      // First sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Then sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get consumables grouped by category
 */
export async function getConsumablesGroupedByCategory(): Promise<Record<string, ConsumableWithItem[]>> {
  const consumables = await getConsumablesWithStats()

  const grouped: Record<string, ConsumableWithItem[]> = {}

  for (const consumable of consumables) {
    const category = consumable.consumableCategory
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(consumable)
  }

  // Sort each group by tag, then by tier, then by name
  for (const category in grouped) {
    grouped[category].sort((a, b) => {
      // First sort by tag
      if (a.tag !== b.tag) {
        return a.tag.localeCompare(b.tag)
      }
      // Then sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Finally sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get consumables grouped by effect type
 */
export async function getConsumablesGroupedByEffect(): Promise<Record<string, ConsumableWithItem[]>> {
  const consumables = await getConsumablesWithStats()

  const grouped: Record<string, ConsumableWithItem[]> = {}

  for (const consumable of consumables) {
    const effect = consumable.effectType
    if (!grouped[effect]) {
      grouped[effect] = []
    }
    grouped[effect].push(consumable)
  }

  // Sort each group by category, then by tier, then by name
  for (const effect in grouped) {
    grouped[effect].sort((a, b) => {
      // First sort by category
      if (a.consumableCategory !== b.consumableCategory) {
        return a.consumableCategory.localeCompare(b.consumableCategory)
      }
      // Then sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Finally sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get consumables grouped by nutrition value
 */
export async function getConsumablesGroupedByNutrition(): Promise<Record<string, ConsumableWithItem[]>> {
  const consumables = await getConsumablesWithStats()

  const grouped: Record<string, ConsumableWithItem[]> = {}

  for (const consumable of consumables) {
    const nutrition = consumable.nutritionValue
    if (!grouped[nutrition]) {
      grouped[nutrition] = []
    }
    grouped[nutrition].push(consumable)
  }

  // Sort each group by tier, then by name
  for (const nutrition in grouped) {
    grouped[nutrition].sort((a, b) => {
      // First sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Then sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get consumable statistics overview with enhanced analysis
 */
export async function getConsumableStatistics() {
  const consumables = await getConsumablesWithStats()
  const consumablesByTag = await getConsumablesGroupedByTag()
  const consumablesByCategory = await getConsumablesGroupedByCategory()
  const consumablesByEffect = await getConsumablesGroupedByEffect()
  const consumablesByNutrition = await getConsumablesGroupedByNutrition()

  const totalConsumables = consumables.length
  const tagCount = Object.keys(consumablesByTag).length
  const categoryCount = Object.keys(consumablesByCategory).length

  // Calculate tier distribution
  const tierDistribution: Record<number, number> = {}
  consumables.forEach((consumable) => {
    tierDistribution[consumable.tier] = (tierDistribution[consumable.tier] || 0) + 1
  })

  // Calculate rarity distribution
  const rarityDistribution: Record<string, number> = {}
  consumables.forEach((consumable) => {
    const rarity = consumable.rarity?.tag || 'Unknown'
    rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1
  })

  // Calculate category distribution
  const categoryDistribution: Record<string, number> = {}
  consumables.forEach((consumable) => {
    categoryDistribution[consumable.consumableCategory] = (categoryDistribution[consumable.consumableCategory] || 0) + 1
  })

  // Calculate effect distribution
  const effectDistribution: Record<string, number> = {}
  consumables.forEach((consumable) => {
    effectDistribution[consumable.effectType] = (effectDistribution[consumable.effectType] || 0) + 1
  })

  // Calculate type counts
  const foodCount = consumables.filter((c) => c.isFood).length
  const potionCount = consumables.filter((c) => c.isPotion).length
  const baitCount = consumables.filter((c) => c.isBait).length
  const craftingResourceCount = consumables.filter((c) => c.isCraftingResource).length

  // Calculate nutrition distribution (only for food items)
  const nutritionDistribution: Record<string, number> = {}
  consumables
    .filter((c) => c.isFood)
    .forEach((consumable) => {
      nutritionDistribution[consumable.nutritionValue] = (nutritionDistribution[consumable.nutritionValue] || 0) + 1
    })

  return {
    total: totalConsumables,
    tags: tagCount,
    categories: categoryCount,
    foodCount,
    potionCount,
    baitCount,
    craftingResourceCount,
    tierDistribution,
    rarityDistribution,
    categoryDistribution,
    effectDistribution,
    nutritionDistribution,
    consumablesByTag: Object.entries(consumablesByTag).map(([tag, consumableList]) => ({
      tag,
      count: consumableList.length,
      category: consumableList[0]?.consumableCategory || 'Unknown',
      isFood: consumableList[0]?.isFood || false
    })),
    consumablesByCategory: Object.entries(consumablesByCategory).map(([category, consumableList]) => ({
      category,
      count: consumableList.length,
      avgTier:
        consumableList.length > 0
          ? Math.round(consumableList.reduce((sum, c) => sum + c.tier, 0) / consumableList.length)
          : 0
    })),
    consumablesByEffect: Object.entries(consumablesByEffect).map(([effect, consumableList]) => ({
      effect,
      count: consumableList.length
    })),
    consumablesByNutrition: Object.entries(consumablesByNutrition).map(([nutrition, consumableList]) => ({
      nutrition,
      count: consumableList.length
    }))
  }
}
