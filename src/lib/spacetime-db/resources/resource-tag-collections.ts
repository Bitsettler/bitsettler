/**
 * Resource collections with centralized tag metadata and biome information
 */

import { ResourceTag } from './resource-tags'

/**
 * Category metadata for individual resource tags
 */
export interface ResourceTagCategory {
  /** Unique identifier for the category */
  id: string
  /** Display name for the category */
  name: string
  /** Description of the category */
  description: string
  /** Icon/emoji for the category */
  icon: string
  /** Section grouping */
  section: string
  /** URL path for the individual tag page */
  href: string
  /** Note: Biome data not available in static exports - would need community data */
  primaryBiomes: readonly string[]
  /** Resource category classification */
  category: string
}

/**
 * Resource collection configuration
 */
export interface ResourceCollection {
  /** Tags that belong to this collection */
  tags: readonly ResourceTag[]
  /** URL path for the collection page */
  href: string
  /** Display name for the collection */
  name: string
  /** Category metadata for each tag in the collection */
  categories: Record<ResourceTag, ResourceTagCategory>
}

/**
 * Resource collections organized by category with navigation metadata and biome information
 */
export const resourceCollections = {
  resources: {
    tags: [
      ResourceTag.Tree,
      ResourceTag.WoodLogs,
      ResourceTag.Sapling,
      ResourceTag.Stick,
      ResourceTag.Stump,
      ResourceTag.Berry,
      ResourceTag.Fruit,
      ResourceTag.Flower,
      ResourceTag.Mushroom,
      ResourceTag.FiberPlant,
      ResourceTag.WildGrain,
      ResourceTag.WildVegetable,
      ResourceTag.Insects,
      ResourceTag.Rock,
      ResourceTag.RockBoulder,
      ResourceTag.RockOutcrop,
      ResourceTag.Clay,
      ResourceTag.Sand,
      ResourceTag.Salt,
      ResourceTag.OreVein,
      ResourceTag.MetalOutcrop,
      ResourceTag.OceanFishSchool,
      ResourceTag.LakeFishSchool,
      ResourceTag.ChummedOceanFishSchool,
      ResourceTag.Baitfish,
      ResourceTag.Mollusks,
      ResourceTag.MonsterDen,
      ResourceTag.WonderResource,
      ResourceTag.EnergyFont,
      ResourceTag.Research,
      ResourceTag.Note,
      ResourceTag.Bones,
      ResourceTag.Door,
      ResourceTag.Obstacle,
      ResourceTag.DepletedResource
    ] as const,
    href: '/compendium/resources',
    name: 'Resources',
    categories: {
      [ResourceTag.Tree]: {
        id: 'tree',
        name: 'Trees',
        description: 'Living trees that can be harvested for lumber and other materials',
        icon: '🌳',
        section: 'Trees & Lumber',
        href: '/compendium/resources/tree',
        primaryBiomes: [], // Not available in static game data
        category: 'Trees & Lumber'
      },
      [ResourceTag.WoodLogs]: {
        id: 'wood-logs',
        name: 'Wood Logs',
        description: 'Processed timber logs from harvested trees',
        icon: '🪵',
        section: 'Trees & Lumber',
        href: '/compendium/resources/wood-logs',
        primaryBiomes: [], // Not available in static game data
        category: 'Trees & Lumber'
      },
      [ResourceTag.Sapling]: {
        id: 'sapling',
        name: 'Saplings',
        description: 'Young trees that can be planted to grow new forests',
        icon: '🌱',
        section: 'Trees & Lumber',
        href: '/compendium/resources/sapling',
        primaryBiomes: [], // Not available in static game data
        category: 'Trees & Lumber'
      },
      [ResourceTag.Stick]: {
        id: 'stick',
        name: 'Sticks',
        description: 'Small wooden branches for crafting and fuel',
        icon: '🪃',
        section: 'Trees & Lumber',
        href: '/compendium/resources/stick',
        primaryBiomes: [], // Not available in static game data
        category: 'Trees & Lumber'
      },
      [ResourceTag.Stump]: {
        id: 'stump',
        name: 'Stumps',
        description: 'Remaining tree stumps after harvesting',
        icon: '🪓',
        section: 'Trees & Lumber',
        href: '/compendium/resources/stump',
        primaryBiomes: [], // Not available in static game data
        category: 'Trees & Lumber'
      },
      [ResourceTag.Berry]: {
        id: 'berry',
        name: 'Berries',
        description: 'Wild berries that can be foraged for food',
        icon: '🫐',
        section: 'Forage & Plants',
        href: '/compendium/resources/berry',
        primaryBiomes: [], // Not available in static game data
        category: 'Forage & Plants'
      },
      [ResourceTag.Fruit]: {
        id: 'fruit',
        name: 'Fruits',
        description: 'Wild fruits that provide nutrition and crafting materials',
        icon: '🍎',
        section: 'Forage & Plants',
        href: '/compendium/resources/fruit',
        primaryBiomes: [], // Not available in static game data
        category: 'Forage & Plants'
      },
      [ResourceTag.Flower]: {
        id: 'flower',
        name: 'Flowers',
        description: 'Colorful flowers used for crafting and decoration',
        icon: '🌸',
        section: 'Forage & Plants',
        href: '/compendium/resources/flower',
        primaryBiomes: [], // Not available in static game data
        category: 'Forage & Plants'
      },
      [ResourceTag.Mushroom]: {
        id: 'mushroom',
        name: 'Mushrooms',
        description: 'Fungi that grow in dark and damp environments',
        icon: '🍄',
        section: 'Forage & Plants',
        href: '/compendium/resources/mushroom',
        primaryBiomes: [], // Not available in static game data
        category: 'Forage & Plants'
      },
      [ResourceTag.FiberPlant]: {
        id: 'fiber-plant',
        name: 'Fiber Plants',
        description: 'Plants that provide fibers for crafting textiles',
        icon: '🌿',
        section: 'Forage & Plants',
        href: '/compendium/resources/fiber-plant',
        primaryBiomes: [], // Not available in static game data
        category: 'Forage & Plants'
      },
      [ResourceTag.WildGrain]: {
        id: 'wild-grain',
        name: 'Wild Grain',
        description: 'Natural grains that can be harvested and processed',
        icon: '🌾',
        section: 'Forage & Plants',
        href: '/compendium/resources/wild-grain',
        primaryBiomes: [], // Not available in static game data
        category: 'Forage & Plants'
      },
      [ResourceTag.WildVegetable]: {
        id: 'wild-vegetable',
        name: 'Wild Vegetables',
        description: 'Edible wild vegetables for nutrition and cooking',
        icon: '🥕',
        section: 'Forage & Plants',
        href: '/compendium/resources/wild-vegetable',
        primaryBiomes: [], // Not available in static game data
        category: 'Forage & Plants'
      },
      [ResourceTag.Insects]: {
        id: 'insects',
        name: 'Insects',
        description: 'Small creatures that can be collected for various uses',
        icon: '🐛',
        section: 'Forage & Plants',
        href: '/compendium/resources/insects',
        primaryBiomes: [], // Not available in static game data
        category: 'Forage & Plants'
      },
      [ResourceTag.Rock]: {
        id: 'rock',
        name: 'Rocks',
        description: 'Common stone materials for construction and tools',
        icon: '🪨',
        section: 'Minerals & Stone',
        href: '/compendium/resources/rock',
        primaryBiomes: [], // Not available in static game data
        category: 'Minerals & Stone'
      },
      [ResourceTag.RockBoulder]: {
        id: 'rock-boulder',
        name: 'Rock Boulders',
        description: 'Large stone formations that yield significant materials',
        icon: '🗿',
        section: 'Minerals & Stone',
        href: '/compendium/resources/rock-boulder',
        primaryBiomes: [], // Not available in static game data
        category: 'Minerals & Stone'
      },
      [ResourceTag.RockOutcrop]: {
        id: 'rock-outcrop',
        name: 'Rock Outcrops',
        description: 'Natural stone formations protruding from the ground',
        icon: '⛰️',
        section: 'Minerals & Stone',
        href: '/compendium/resources/rock-outcrop',
        primaryBiomes: [], // Not available in static game data
        category: 'Minerals & Stone'
      },
      [ResourceTag.Clay]: {
        id: 'clay',
        name: 'Clay',
        description: 'Malleable earth material for pottery and construction',
        icon: '🏺',
        section: 'Minerals & Stone',
        href: '/compendium/resources/clay',
        primaryBiomes: [], // Not available in static game data
        category: 'Minerals & Stone'
      },
      [ResourceTag.Sand]: {
        id: 'sand',
        name: 'Sand',
        description: 'Fine granular material for construction and glassmaking',
        icon: '🏖️',
        section: 'Minerals & Stone',
        href: '/compendium/resources/sand',
        primaryBiomes: [], // Not available in static game data
        category: 'Minerals & Stone'
      },
      [ResourceTag.Salt]: {
        id: 'salt',
        name: 'Salt',
        description: 'Mineral salt for preservation and cooking',
        icon: '🧂',
        section: 'Minerals & Stone',
        href: '/compendium/resources/salt',
        primaryBiomes: [], // Not available in static game data
        category: 'Minerals & Stone'
      },
      [ResourceTag.OreVein]: {
        id: 'ore-vein',
        name: 'Ore Veins',
        description: 'Metal-rich deposits that yield valuable ores',
        icon: '⛏️',
        section: 'Minerals & Stone',
        href: '/compendium/resources/ore-vein',
        primaryBiomes: [], // Not available in static game data
        category: 'Minerals & Stone'
      },
      [ResourceTag.MetalOutcrop]: {
        id: 'metal-outcrop',
        name: 'Metal Outcrops',
        description: 'Surface metal deposits for mining operations',
        icon: '🔩',
        section: 'Minerals & Stone',
        href: '/compendium/resources/metal-outcrop',
        primaryBiomes: [], // Not available in static game data
        category: 'Minerals & Stone'
      },
      [ResourceTag.OceanFishSchool]: {
        id: 'ocean-fish-school',
        name: 'Ocean Fish Schools',
        description: 'Groups of fish in ocean waters for fishing',
        icon: '🐟',
        section: 'Aquatic Resources',
        href: '/compendium/resources/ocean-fish-school',
        primaryBiomes: [], // Not available in static game data
        category: 'Aquatic Resources'
      },
      [ResourceTag.LakeFishSchool]: {
        id: 'lake-fish-school',
        name: 'Lake Fish Schools',
        description: 'Freshwater fish groups found in lakes and rivers',
        icon: '🐠',
        section: 'Aquatic Resources',
        href: '/compendium/resources/lake-fish-school',
        primaryBiomes: [], // Not available in static game data
        category: 'Aquatic Resources'
      },
      [ResourceTag.ChummedOceanFishSchool]: {
        id: 'chummed-ocean-fish-school',
        name: 'Chummed Ocean Fish Schools',
        description: 'Enhanced fish schools attracted by chum bait',
        icon: '🎣',
        section: 'Aquatic Resources',
        href: '/compendium/resources/chummed-ocean-fish-school',
        primaryBiomes: [], // Not available in static game data
        category: 'Aquatic Resources'
      },
      [ResourceTag.Baitfish]: {
        id: 'baitfish',
        name: 'Baitfish',
        description: 'Small fish used as bait for larger catches',
        icon: '🐡',
        section: 'Aquatic Resources',
        href: '/compendium/resources/baitfish',
        primaryBiomes: [], // Not available in static game data
        category: 'Aquatic Resources'
      },
      [ResourceTag.Mollusks]: {
        id: 'mollusks',
        name: 'Mollusks',
        description: 'Shellfish and other soft-bodied marine creatures',
        icon: '🦪',
        section: 'Aquatic Resources',
        href: '/compendium/resources/mollusks',
        primaryBiomes: [], // Not available in static game data
        category: 'Aquatic Resources'
      },
      [ResourceTag.MonsterDen]: {
        id: 'monster-den',
        name: 'Monster Dens',
        description: 'Dangerous lairs where creatures spawn and can be defeated',
        icon: '👹',
        section: 'Special Resources',
        href: '/compendium/resources/monster-den',
        primaryBiomes: [], // Not available in static game data
        category: 'Special Resources'
      },
      [ResourceTag.WonderResource]: {
        id: 'wonder-resource',
        name: 'Wonder Resources',
        description: 'Rare and magical resources with unique properties',
        icon: '✨',
        section: 'Special Resources',
        href: '/compendium/resources/wonder-resource',
        primaryBiomes: [], // Not available in static game data
        category: 'Special Resources'
      },
      [ResourceTag.EnergyFont]: {
        id: 'energy-font',
        name: 'Energy Fonts',
        description: 'Sources of magical energy for powering devices',
        icon: '⚡',
        section: 'Special Resources',
        href: '/compendium/resources/energy-font',
        primaryBiomes: [], // Not available in static game data
        category: 'Special Resources'
      },
      [ResourceTag.Research]: {
        id: 'research',
        name: 'Research',
        description: 'Knowledge nodes that provide research points',
        icon: '📚',
        section: 'Special Resources',
        href: '/compendium/resources/research',
        primaryBiomes: [], // Not available in static game data
        category: 'Special Resources'
      },
      [ResourceTag.Note]: {
        id: 'note',
        name: 'Notes',
        description: 'Written records and lore scattered throughout the world',
        icon: '📝',
        section: 'Special Resources',
        href: '/compendium/resources/note',
        primaryBiomes: [], // Not available in static game data
        category: 'Special Resources'
      },
      [ResourceTag.Bones]: {
        id: 'bones',
        name: 'Bones',
        description: 'Skeletal remains useful for crafting and decoration',
        icon: '🦴',
        section: 'Special Resources',
        href: '/compendium/resources/bones',
        primaryBiomes: [], // Not available in static game data
        category: 'Special Resources'
      },
      [ResourceTag.Door]: {
        id: 'door',
        name: 'Doors',
        description: 'Interactive barriers that can be opened and closed',
        icon: '🚪',
        section: 'Interactive Objects',
        href: '/compendium/resources/door',
        primaryBiomes: [], // Not available in static game data
        category: 'Interactive Objects'
      },
      [ResourceTag.Obstacle]: {
        id: 'obstacle',
        name: 'Obstacles',
        description: 'Blocking objects that can be removed or destroyed',
        icon: '🚧',
        section: 'Interactive Objects',
        href: '/compendium/resources/obstacle',
        primaryBiomes: [], // Not available in static game data
        category: 'Interactive Objects'
      },
      [ResourceTag.DepletedResource]: {
        id: 'depleted-resource',
        name: 'Depleted Resources',
        description: 'Exhausted resource nodes that no longer yield materials',
        icon: '💀',
        section: 'Interactive Objects',
        href: '/compendium/resources/depleted-resource',
        primaryBiomes: [], // Not available in static game data
        category: 'Interactive Objects'
      }
    }
  }
} as const

/**
 * Helper function to find which collection a resource tag belongs to
 */
export function findResourceTagCollection(tag: string): ResourceCollection | null {
  for (const collection of Object.values(resourceCollections)) {
    if (collection.tags.some((collectionTag) => collectionTag === tag)) {
      return collection
    }
  }
  return null
}

