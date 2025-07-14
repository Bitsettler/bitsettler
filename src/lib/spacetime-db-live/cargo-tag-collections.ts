/**
 * Cargo collections with centralized tag metadata
 */

import { CargoTag } from './cargo-tags'

/**
 * Category metadata for individual cargo tags
 */
export interface CargoTagCategory {
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
}

/**
 * Cargo collection configuration
 */
export interface CargoCollection {
  /** Tags that belong to this collection */
  tags: readonly CargoTag[]
  /** URL path for the collection page */
  href: string
  /** Display name for the collection */
  name: string
  /** Category metadata for each tag in the collection */
  categories: Record<CargoTag, CargoTagCategory>
}

/**
 * Cargo collections organized by category with navigation metadata
 */
export const cargoCollections = {
  cargo: {
    tags: [
      CargoTag.Animal,
      CargoTag.Monster,
      CargoTag.OceanFish,
      CargoTag.Timber,
      CargoTag.Chunk,
      CargoTag.OreChunk,
      CargoTag.Geode,
      CargoTag.Roots,
      CargoTag.BrickSlab,
      CargoTag.Frame,
      CargoTag.Sheeting,
      CargoTag.Tarp,
      CargoTag.Trunk,
      CargoTag.Vehicle,
      CargoTag.Boat,
      CargoTag.Package,
      CargoTag.BricoGoods,
      CargoTag.TravelerGoods,
      CargoTag.Supplies,
      CargoTag.HexCoinSack,
      CargoTag.HexiteCapsule,
      CargoTag.Energy
    ] as const,
    href: '/compendium/cargo',
    name: 'Cargo',
    categories: {
      [CargoTag.Animal]: {
        id: 'animal',
        name: 'Animals',
        description: 'Wild and domesticated animals that can be transported',
        icon: '🐾',
        section: 'Creatures & Wildlife',
        href: '/compendium/cargo/animal'
      },
      [CargoTag.Monster]: {
        id: 'monster',
        name: 'Monsters',
        description: 'Defeated monsters and their remains',
        icon: '👹',
        section: 'Creatures & Wildlife',
        href: '/compendium/cargo/monster'
      },
      [CargoTag.OceanFish]: {
        id: 'ocean-fish',
        name: 'Ocean Fish',
        description: 'Marine life caught from the ocean',
        icon: '🐟',
        section: 'Creatures & Wildlife',
        href: '/compendium/cargo/ocean-fish'
      },
      [CargoTag.Timber]: {
        id: 'timber',
        name: 'Timber',
        description: 'Raw wood logs from harvested trees',
        icon: '🪵',
        section: 'Raw Materials',
        href: '/compendium/cargo/timber'
      },
      [CargoTag.Chunk]: {
        id: 'chunk',
        name: 'Stone Chunks',
        description: 'Raw stone and mineral chunks',
        icon: '🪨',
        section: 'Raw Materials',
        href: '/compendium/cargo/chunk'
      },
      [CargoTag.OreChunk]: {
        id: 'ore-chunk',
        name: 'Ore Chunks',
        description: 'Valuable metal ore chunks for processing',
        icon: '⛏️',
        section: 'Raw Materials',
        href: '/compendium/cargo/ore-chunk'
      },
      [CargoTag.Geode]: {
        id: 'geode',
        name: 'Geodes',
        description: 'Crystalline formations containing precious stones',
        icon: '💎',
        section: 'Raw Materials',
        href: '/compendium/cargo/geode'
      },
      [CargoTag.Roots]: {
        id: 'roots',
        name: 'Roots',
        description: 'Plant roots and underground materials',
        icon: '🌿',
        section: 'Raw Materials',
        href: '/compendium/cargo/roots'
      },
      [CargoTag.BrickSlab]: {
        id: 'brick-slab',
        name: 'Brick Slabs',
        description: 'Processed building materials and brick slabs',
        icon: '🧱',
        section: 'Processed Materials',
        href: '/compendium/cargo/brick-slab'
      },
      [CargoTag.Frame]: {
        id: 'frame',
        name: 'Frames',
        description: 'Structural frames for construction',
        icon: '🏗️',
        section: 'Processed Materials',
        href: '/compendium/cargo/frame'
      },
      [CargoTag.Sheeting]: {
        id: 'sheeting',
        name: 'Sheeting',
        description: 'Processed sheets and covering materials',
        icon: '📄',
        section: 'Processed Materials',
        href: '/compendium/cargo/sheeting'
      },
      [CargoTag.Tarp]: {
        id: 'tarp',
        name: 'Tarps',
        description: 'Protective covering and tarp materials',
        icon: '🛡️',
        section: 'Processed Materials',
        href: '/compendium/cargo/tarp'
      },
      [CargoTag.Trunk]: {
        id: 'trunk',
        name: 'Trunks',
        description: 'Storage containers and trunk cargo',
        icon: '📦',
        section: 'Processed Materials',
        href: '/compendium/cargo/trunk'
      },
      [CargoTag.Vehicle]: {
        id: 'vehicle',
        name: 'Vehicles',
        description: 'Land vehicles and transportation equipment',
        icon: '🚗',
        section: 'Vehicles & Transport',
        href: '/compendium/cargo/vehicle'
      },
      [CargoTag.Boat]: {
        id: 'boat',
        name: 'Boats',
        description: 'Watercraft and marine vessels',
        icon: '⛵',
        section: 'Vehicles & Transport',
        href: '/compendium/cargo/boat'
      },
      [CargoTag.Package]: {
        id: 'package',
        name: 'Packages',
        description: 'Wrapped goods and packaged items for trade',
        icon: '📦',
        section: 'Trade & Commerce',
        href: '/compendium/cargo/package'
      },
      [CargoTag.BricoGoods]: {
        id: 'brico-goods',
        name: 'Brico Goods',
        description: 'Specialized Brico trading goods and materials',
        icon: '🏪',
        section: 'Trade & Commerce',
        href: '/compendium/cargo/brico-goods'
      },
      [CargoTag.TravelerGoods]: {
        id: 'traveler-goods',
        name: 'Traveler Goods',
        description: 'Items carried by traveling merchants',
        icon: '🎒',
        section: 'Trade & Commerce',
        href: '/compendium/cargo/traveler-goods'
      },
      [CargoTag.Supplies]: {
        id: 'supplies',
        name: 'Supplies',
        description: 'General supplies and provisions',
        icon: '📋',
        section: 'Trade & Commerce',
        href: '/compendium/cargo/supplies'
      },
      [CargoTag.HexCoinSack]: {
        id: 'hex-coin-sack',
        name: 'Hex Coin Sacks',
        description: 'Bags containing valuable hex coins',
        icon: '💰',
        section: 'Currency & Value',
        href: '/compendium/cargo/hex-coin-sack'
      },
      [CargoTag.HexiteCapsule]: {
        id: 'hexite-capsule',
        name: 'Hexite Capsules',
        description: 'Capsules containing precious hexite energy',
        icon: '⚡',
        section: 'Currency & Value',
        href: '/compendium/cargo/hexite-capsule'
      },
      [CargoTag.Energy]: {
        id: 'energy',
        name: 'Energy',
        description: 'Pure energy forms and power sources',
        icon: '🔋',
        section: 'Special Items',
        href: '/compendium/cargo/energy'
      }
    }
  }
} as const

/**
 * Helper function to find which collection a cargo tag belongs to
 */
export function findCargoTagCollection(tag: string): CargoCollection | null {
  for (const collection of Object.values(cargoCollections)) {
    if (collection.tags.some((collectionTag) => collectionTag === tag)) {
      return collection
    }
  }
  return null
}