/**
 * Organized collections of item tags for different categories used throughout the application
 * This file defines logical groupings of tags and their corresponding collection pages.
 */

import { ItemTag } from './tags'

/**
 * Category metadata for individual tags within a collection
 */
export interface TagCategory {
  /** Unique identifier for the category */
  id: string
  /** Display name for the category */
  name: string
  /** Description of the category */
  description: string
  /** Icon/emoji for the category */
  icon: string
  /** Section grouping (e.g., "Food & Nutrition", "Crafting", etc.) */
  section: string
  /** URL path for the individual tag page */
  href: string
}

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
  /** Category metadata for each tag in the collection */
  categories: Partial<Record<ItemTag, TagCategory>>
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
    name: 'Equipment',
    categories: {
      [ItemTag.MetalArmor]: {
        id: 'metal-armor',
        name: 'Metal Armor',
        description: 'Heavy armor and protective gear made from metal',
        icon: '🛡️',
        section: 'Armor & Clothing',
        href: '/compendium/metal-armor'
      },
      [ItemTag.LeatherClothing]: {
        id: 'leather-clothing',
        name: 'Leather Clothing',
        description: 'Flexible clothing and armor made from leather',
        icon: '🧥',
        section: 'Armor & Clothing',
        href: '/compendium/leather-clothing'
      },
      [ItemTag.ClothClothing]: {
        id: 'cloth-clothing',
        name: 'Cloth Clothing',
        description: 'Comfortable clothing made from various fabrics',
        icon: '👘',
        section: 'Armor & Clothing',
        href: '/compendium/cloth-clothing'
      },
      [ItemTag.CosmeticClothes]: {
        id: 'cosmetic-clothes',
        name: 'Cosmetic Clothing',
        description: 'Special decorative and cosmetic clothing items',
        icon: '✨',
        section: 'Armor & Clothing',
        href: '/compendium/cosmetic-clothes'
      },
      [ItemTag.Jewelry]: {
        id: 'jewelry',
        name: 'Jewelry',
        description: 'Rings, necklaces, and other precious accessories',
        icon: '💍',
        section: 'Jewelry & Artifacts',
        href: '/compendium/jewelry'
      },
      [ItemTag.AutomataHeart]: {
        id: 'automata-heart',
        name: 'Automata Heart',
        description: 'Magical heart components and automata artifacts',
        icon: '🤖',
        section: 'Jewelry & Artifacts',
        href: '/compendium/automata-heart'
      }
    }
  },

  // Weapons collection
  weapons: {
    tags: [ItemTag.Weapon] as const,
    href: '/compendium/weapon',
    name: 'Weapons',
    categories: {
      [ItemTag.Weapon]: {
        id: 'weapon',
        name: 'Weapons',
        description: 'Combat weapons and tools for hunting and protection',
        icon: '⚔️',
        section: 'Combat Equipment',
        href: '/compendium/weapon'
      }
    }
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
    name: 'Tools',
    categories: {
      [ItemTag.ForesterTool]: {
        id: 'forester-tool',
        name: 'Forester Tools',
        description: 'Axes for cutting trees and harvesting wood',
        icon: '🪓',
        section: 'Gathering',
        href: '/compendium/forester-tool'
      },
      [ItemTag.CarpenterTool]: {
        id: 'carpenter-tool',
        name: 'Carpenter Tools',
        description: 'Saws for processing wood and carpentry',
        icon: '🪚',
        section: 'Crafting',
        href: '/compendium/carpenter-tool'
      },
      [ItemTag.MinerTool]: {
        id: 'miner-tool',
        name: 'Miner Tools',
        description: 'Pickaxes for mining ore and stone',
        icon: '⛏️',
        section: 'Gathering',
        href: '/compendium/miner-tool'
      },
      [ItemTag.MasonTool]: {
        id: 'mason-tool',
        name: 'Mason Tools',
        description: 'Chisels for stonework and masonry',
        icon: '🔨',
        section: 'Crafting',
        href: '/compendium/mason-tool'
      },
      [ItemTag.BlacksmithTool]: {
        id: 'blacksmith-tool',
        name: 'Blacksmith Tools',
        description: 'Hammers for metalworking and smithing',
        icon: '🔨',
        section: 'Crafting',
        href: '/compendium/blacksmith-tool'
      },
      [ItemTag.LeatherworkerTool]: {
        id: 'leatherworker-tool',
        name: 'Leatherworker Tools',
        description: 'Knives for leather working and hide processing',
        icon: '🔪',
        section: 'Crafting',
        href: '/compendium/leatherworker-tool'
      },
      [ItemTag.TailorTool]: {
        id: 'tailor-tool',
        name: 'Tailor Tools',
        description: 'Scissors for cloth work and tailoring',
        icon: '✂️',
        section: 'Crafting',
        href: '/compendium/tailor-tool'
      },
      [ItemTag.ScholarTool]: {
        id: 'scholar-tool',
        name: 'Scholar Tools',
        description: 'Quills for research and knowledge work',
        icon: '🪶',
        section: 'Crafting',
        href: '/compendium/scholar-tool'
      },
      [ItemTag.FarmerTool]: {
        id: 'farmer-tool',
        name: 'Farmer Tools',
        description: 'Hoes for farming and agriculture',
        icon: '🌾',
        section: 'Gathering',
        href: '/compendium/farmer-tool'
      },
      [ItemTag.FisherTool]: {
        id: 'fisher-tool',
        name: 'Fisher Tools',
        description: 'Rods for fishing and aquatic harvesting',
        icon: '🎣',
        section: 'Gathering',
        href: '/compendium/fisher-tool'
      },
      [ItemTag.ForagerTool]: {
        id: 'forager-tool',
        name: 'Forager Tools',
        description: 'Pots for foraging and item collection',
        icon: '🧺',
        section: 'Gathering',
        href: '/compendium/forager-tool'
      },
      [ItemTag.HunterTool]: {
        id: 'hunter-tool',
        name: 'Hunter Tools',
        description: 'Machetes for hunting and combat preparation',
        icon: '🏹',
        section: 'Gathering',
        href: '/compendium/hunter-tool'
      }
    }
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
    href: '/compendium/consumables',
    name: 'Consumables',
    categories: {
      [ItemTag.BasicFood]: {
        id: 'basic-food',
        name: 'Basic Food',
        description: 'Simple food items for basic nutrition',
        icon: '🍞',
        section: 'Food & Nutrition',
        href: '/compendium/basic-food'
      },
      [ItemTag.Meal]: {
        id: 'meal',
        name: 'Prepared Meals',
        description: 'Cooked meals with high nutritional value',
        icon: '🍽️',
        section: 'Food & Nutrition',
        href: '/compendium/meal'
      },
      [ItemTag.RawMeal]: {
        id: 'raw-meal',
        name: 'Raw Meals',
        description: 'Uncooked meal ingredients and preparations',
        icon: '🥩',
        section: 'Food & Nutrition',
        href: '/compendium/raw-meal'
      },
      [ItemTag.Berry]: {
        id: 'berry',
        name: 'Berries',
        description: 'Fresh berries and fruit for quick nutrition',
        icon: '🫐',
        section: 'Food & Nutrition',
        href: '/compendium/berry'
      },
      [ItemTag.CitricBerry]: {
        id: 'citric-berry',
        name: 'Citric Berries',
        description: 'Special citrus berries with enhanced effects',
        icon: '🍊',
        section: 'Food & Nutrition',
        href: '/compendium/citric-berry'
      },
      [ItemTag.Mushroom]: {
        id: 'mushroom',
        name: 'Mushrooms',
        description: 'Edible mushrooms and fungi',
        icon: '🍄',
        section: 'Food & Nutrition',
        href: '/compendium/mushroom'
      },
      [ItemTag.Vegetable]: {
        id: 'vegetable',
        name: 'Vegetables',
        description: 'Fresh vegetables and plant-based foods',
        icon: '🥕',
        section: 'Food & Nutrition',
        href: '/compendium/vegetable'
      },
      [ItemTag.WonderFruit]: {
        id: 'wonder-fruit',
        name: 'Wonder Fruit',
        description: 'Magical fruits with special properties',
        icon: '🌟',
        section: 'Food & Nutrition',
        href: '/compendium/wonder-fruit'
      },
      [ItemTag.Sugar]: {
        id: 'sugar',
        name: 'Sugar',
        description: 'Sweet ingredients for cooking and crafting',
        icon: '🍯',
        section: 'Food & Nutrition',
        href: '/compendium/sugar'
      },
      [ItemTag.Tea]: {
        id: 'tea',
        name: 'Tea',
        description: 'Brewed teas with various beneficial effects',
        icon: '🍵',
        section: 'Food & Nutrition',
        href: '/compendium/tea'
      },
      [ItemTag.HealingPotion]: {
        id: 'healing-potion',
        name: 'Healing Potions',
        description: 'Potions that restore health and vitality',
        icon: '🧪',
        section: 'Potions & Medicine',
        href: '/compendium/healing-potion'
      },
      [ItemTag.StaminaPotion]: {
        id: 'stamina-potion',
        name: 'Stamina Potions',
        description: 'Potions that restore stamina and energy',
        icon: '⚡',
        section: 'Potions & Medicine',
        href: '/compendium/stamina-potion'
      },
      [ItemTag.CraftingSpeedElixir]: {
        id: 'crafting-speed-elixir',
        name: 'Crafting Speed Elixirs',
        description: 'Elixirs that boost crafting speed and efficiency',
        icon: '🚀',
        section: 'Potions & Medicine',
        href: '/compendium/crafting-speed-elixir'
      },
      [ItemTag.Bandage]: {
        id: 'bandage',
        name: 'Bandages',
        description: 'Medical supplies for treating wounds',
        icon: '🩹',
        section: 'Potions & Medicine',
        href: '/compendium/bandage'
      },
      [ItemTag.Bait]: {
        id: 'bait',
        name: 'Bait',
        description: 'Fishing bait to attract various fish',
        icon: '🪱',
        section: 'Fishing Supplies',
        href: '/compendium/bait'
      },
      [ItemTag.Chum]: {
        id: 'chum',
        name: 'Chum',
        description: 'Special fishing attractants and chum',
        icon: '🐟',
        section: 'Fishing Supplies',
        href: '/compendium/chum'
      },
      [ItemTag.Recipe]: {
        id: 'recipe',
        name: 'Recipes',
        description: 'Crafting recipes and knowledge scrolls',
        icon: '📜',
        section: 'Crafting & Recipes',
        href: '/compendium/recipe'
      }
    }
  },

  // Collectibles collection - deeds, writs, and special collectible items
  collectibles: {
    tags: [ItemTag.Deed, ItemTag.DeployableDeed] as const,
    href: '/compendium/collectibles',
    name: 'Collectibles',
    categories: {
      [ItemTag.Deed]: {
        id: 'deed',
        name: 'Deeds',
        description: 'Property deeds and land ownership documents',
        icon: '📜',
        section: 'Property & Ownership',
        href: '/compendium/deed'
      },
      [ItemTag.DeployableDeed]: {
        id: 'deployable-deed',
        name: 'Deployable Deeds',
        description: 'Special deployable property and structure deeds',
        icon: '🏗️',
        section: 'Property & Ownership',
        href: '/compendium/deployable-deed'
      }
    }
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
