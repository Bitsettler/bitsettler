/**
 * Organized collections of item tags for different categories used throughout the application
 * This file defines logical groupings of tags and their corresponding collection pages.
 * Updated to use string tags instead of hardcoded enum.
 */

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
  tags: readonly string[]
  /** URL path for the collection page */
  href: string
  /** Display name for the collection */
  name: string
  /** Category metadata for each tag in the collection */
  categories: Partial<Record<string, TagCategory>>
}

/**
 * Tag collections organized by category with navigation metadata
 */
export const tagCollections = {
  // Equipment collection - all wearable items
  equipment: {
    tags: [
      'Metal Armor',
      'Leather Clothing',
      'Cloth Clothing',
      'Cosmetic Clothes',
      'Jewelry',
      'Automata Heart'
    ] as const,
    href: '/compendium/equipment',
    name: 'Equipment',
    categories: {
      'Metal Armor': {
        id: 'metal-armor',
        name: 'Metal Armor',
        description: 'Heavy armor and protective gear made from metal',
        icon: '🛡️',
        section: 'Armor & Clothing',
        href: '/compendium/metal-armor'
      },
      'Leather Clothing': {
        id: 'leather-clothing',
        name: 'Leather Clothing',
        description: 'Flexible clothing and armor made from leather',
        icon: '🧥',
        section: 'Armor & Clothing',
        href: '/compendium/leather-clothing'
      },
      'Cloth Clothing': {
        id: 'cloth-clothing',
        name: 'Cloth Clothing',
        description: 'Comfortable clothing made from various fabrics',
        icon: '👘',
        section: 'Armor & Clothing',
        href: '/compendium/cloth-clothing'
      },
      'Cosmetic Clothes': {
        id: 'cosmetic-clothes',
        name: 'Cosmetic Clothing',
        description: 'Special decorative and cosmetic clothing items',
        icon: '✨',
        section: 'Armor & Clothing',
        href: '/compendium/cosmetic-clothes'
      },
      Jewelry: {
        id: 'jewelry',
        name: 'Jewelry',
        description: 'Rings, necklaces, and other precious accessories',
        icon: '💍',
        section: 'Jewelry & Artifacts',
        href: '/compendium/jewelry'
      },
      'Automata Heart': {
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
    tags: ['Weapon'] as const,
    href: '/compendium/weapon',
    name: 'Weapons',
    categories: {
      Weapon: {
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
      'Blacksmith Tool',
      'Carpenter Tool',
      'Farmer Tool',
      'Fisher Tool',
      'Forager Tool',
      'Forester Tool',
      'Hunter Tool',
      'Leatherworker Tool',
      'Mason Tool',
      'Miner Tool',
      'Scholar Tool',
      'Tailor Tool'
    ] as const,
    href: '/compendium/tools',
    name: 'Tools',
    categories: {
      'Forester Tool': {
        id: 'forester-tool',
        name: 'Forester Tools',
        description: 'Axes for cutting trees and harvesting wood',
        icon: '🪓',
        section: 'Gathering',
        href: '/compendium/forester-tool'
      },
      'Carpenter Tool': {
        id: 'carpenter-tool',
        name: 'Carpenter Tools',
        description: 'Saws for processing wood and carpentry',
        icon: '🪚',
        section: 'Crafting',
        href: '/compendium/carpenter-tool'
      },
      'Miner Tool': {
        id: 'miner-tool',
        name: 'Miner Tools',
        description: 'Pickaxes for mining ore and stone',
        icon: '⛏️',
        section: 'Gathering',
        href: '/compendium/miner-tool'
      },
      'Mason Tool': {
        id: 'mason-tool',
        name: 'Mason Tools',
        description: 'Chisels for stonework and masonry',
        icon: '🔨',
        section: 'Crafting',
        href: '/compendium/mason-tool'
      },
      'Blacksmith Tool': {
        id: 'blacksmith-tool',
        name: 'Blacksmith Tools',
        description: 'Hammers for metalworking and smithing',
        icon: '🔨',
        section: 'Crafting',
        href: '/compendium/blacksmith-tool'
      },
      'Leatherworker Tool': {
        id: 'leatherworker-tool',
        name: 'Leatherworker Tools',
        description: 'Knives for leather working and hide processing',
        icon: '🔪',
        section: 'Crafting',
        href: '/compendium/leatherworker-tool'
      },
      'Tailor Tool': {
        id: 'tailor-tool',
        name: 'Tailor Tools',
        description: 'Scissors for cloth work and tailoring',
        icon: '✂️',
        section: 'Crafting',
        href: '/compendium/tailor-tool'
      },
      'Scholar Tool': {
        id: 'scholar-tool',
        name: 'Scholar Tools',
        description: 'Tools for research and scholarly work',
        icon: '📚',
        section: 'Crafting',
        href: '/compendium/scholar-tool'
      },
      'Fisher Tool': {
        id: 'fisher-tool',
        name: 'Fisher Tools',
        description: 'Fishing rods and nets for catching fish',
        icon: '🎣',
        section: 'Gathering',
        href: '/compendium/fisher-tool'
      },
      'Farmer Tool': {
        id: 'farmer-tool',
        name: 'Farmer Tools',
        description: 'Hoes and tools for farming and agriculture',
        icon: '🚜',
        section: 'Gathering',
        href: '/compendium/farmer-tool'
      },
      'Hunter Tool': {
        id: 'hunter-tool',
        name: 'Hunter Tools',
        description: 'Bows and tools for hunting animals',
        icon: '🏹',
        section: 'Gathering',
        href: '/compendium/hunter-tool'
      },
      'Forager Tool': {
        id: 'forager-tool',
        name: 'Forager Tools',
        description: 'Sickles for foraging and plant gathering',
        icon: '🌿',
        section: 'Gathering',
        href: '/compendium/forager-tool'
      }
    }
  },

  // Consumables collection
  consumables: {
    tags: [
      'Basic Food',
      'Bandage',
      'Bait',
      'Berry',
      'Chum',
      'Citric Berry',
      'Crafting Speed Elixir',
      'Healing Potion',
      'Meal',
      'Mushroom',
      'Raw Meal',
      'Recipe',
      'Stamina Potion',
      'Sugar',
      'Tea',
      'Vegetable',
      'Wonder Fruit'
    ] as const,
    href: '/compendium/consumables',
    name: 'Consumables',
    categories: {
      'Basic Food': {
        id: 'basic-food',
        name: 'Basic Food',
        description: 'Simple food items for basic nutrition',
        icon: '🍞',
        section: 'Food & Nutrition',
        href: '/compendium/basic-food'
      },
      Meal: {
        id: 'meal',
        name: 'Prepared Meals',
        description: 'Cooked meals with high nutritional value',
        icon: '🍽️',
        section: 'Food & Nutrition',
        href: '/compendium/meal'
      }
    }
  },

  // Collectibles collection
  collectibles: {
    tags: ['Deed', 'Deployable Deed', 'Knowledge Scroll', 'Blueprint'] as const,
    href: '/compendium/collectibles',
    name: 'Collectibles',
    categories: {
      Deed: {
        id: 'deed',
        name: 'Deeds',
        description: 'Property deeds and ownership documents',
        icon: '📜',
        section: 'Documents',
        href: '/compendium/deed'
      },
      'Knowledge Scroll': {
        id: 'knowledge-scroll',
        name: 'Knowledge Scrolls',
        description: 'Scrolls containing valuable knowledge and information',
        icon: '📚',
        section: 'Documents',
        href: '/compendium/knowledge-scroll'
      }
    }
  }
} as const
