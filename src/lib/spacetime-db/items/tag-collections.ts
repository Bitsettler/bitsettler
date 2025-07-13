/**
 * Organized collections of item tags for different categories used throughout the application
 * This file defines logical groupings of tags and their corresponding collection pages.
 */

import { ItemTag } from './tags'

/**
 * Collection configuration with metadata for navigation
 */
export interface TagCollection {
  /** Tags that belong to this collection */
  tags: readonly ItemTag[]
  /** URL path for the collection page */
  href: string
  /** Display name for the collection */
  name: string
}

/**
 * Tag collections organized by category with navigation metadata
 */
export const tagCollections = {
  // Equipment collection - all wearable items
  equipment: {
    tags: [
      ItemTag.MetalArmor,
      ItemTag.LeatherClothing,
      ItemTag.ClothClothing,
      ItemTag.CosmeticClothes,
      ItemTag.Jewelry,
      ItemTag.AutomataHeart
    ] as const,
    href: '/compendium/equipment',
    name: 'Equipment'
  },

  // Weapons collection
  weapons: {
    tags: [ItemTag.Weapon] as const,
    href: '/compendium/weapon',
    name: 'Weapons'
  },

  // Tools collection - all profession tools
  tools: {
    tags: [
      ItemTag.BlacksmithTool,
      ItemTag.CarpenterTool,
      ItemTag.FarmerTool,
      ItemTag.FisherTool,
      ItemTag.ForagerTool,
      ItemTag.ForesterTool,
      ItemTag.HunterTool,
      ItemTag.LeatherworkerTool,
      ItemTag.MasonTool,
      ItemTag.MinerTool,
      ItemTag.ScholarTool,
      ItemTag.TailorTool
    ] as const,
    href: '/compendium/tools',
    name: 'Tools'
  },

  // Consumables collection - all consumable items
  consumables: {
    tags: [
      ItemTag.BasicFood,
      ItemTag.Bandage,
      ItemTag.Bait,
      ItemTag.Berry,
      ItemTag.Chum,
      ItemTag.CitricBerry,
      ItemTag.CraftingSpeedElixir,
      ItemTag.HealingPotion,
      ItemTag.Meal,
      ItemTag.Mushroom,
      ItemTag.RawMeal,
      ItemTag.Recipe,
      ItemTag.StaminaPotion,
      ItemTag.Sugar,
      ItemTag.Tea,
      ItemTag.Vegetable,
      ItemTag.WonderFruit
    ] as const,
    href: '/compendium/consumables', // Future consumables collection page
    name: 'Consumables'
  },

  // Collectibles collection - deeds, writs, and special collectible items
  collectibles: {
    tags: [ItemTag.Deed, ItemTag.DeployableDeed] as const,
    href: '/compendium/collectibles',
    name: 'Collectibles'
  }
} as const

/**
 * Helper function to find which collection a tag belongs to
 */
export function findTagCollection(tag: string): TagCollection | null {
  for (const collection of Object.values(tagCollections)) {
    if (collection.tags.some((collectionTag) => collectionTag === tag)) {
      return collection
    }
  }
  return null
}

/**
 * Helper function to get all tags from equipment collection (for backwards compatibility)
 */
export function getEquipmentTags(): readonly ItemTag[] {
  return tagCollections.equipment.tags
}

/**
 * Helper function to get all tags from weapons collection (for backwards compatibility)
 */
export function getWeaponTags(): readonly ItemTag[] {
  return tagCollections.weapons.tags
}
