import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import cargoDescData from '@/data/global/cargo_desc.json'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'

// Combined cargo data with computed properties
export interface CargoWithStats extends CargoDesc {
  cargoCategory: string
  isTransportable: boolean
  isAnimal: boolean
  isMaterial: boolean
  isVehicle: boolean
  isPackage: boolean
  isTradingGoods: boolean
  volumeCategory: string
  movementImpact: string
  pickupDifficulty: string
}

/**
 * Get cargo-related data from static JSON files
 */
function getCargoData() {
  return {
    cargoDesc: camelCaseDeep<CargoDesc[]>(cargoDescData)
  }
}

/**
 * Get cargo category based on tag
 */
function getCargoCategory(tag: string): string {
  const categoryMapping: Record<string, string> = {
    Animal: 'Creatures & Wildlife',
    Monster: 'Creatures & Wildlife',
    'Ocean Fish': 'Creatures & Wildlife',
    Timber: 'Raw Materials',
    Chunk: 'Raw Materials',
    'Ore Chunk': 'Raw Materials',
    Geode: 'Raw Materials',
    Roots: 'Raw Materials',
    'Brick Slab': 'Processed Materials',
    Frame: 'Processed Materials',
    Sheeting: 'Processed Materials',
    Tarp: 'Processed Materials',
    Trunk: 'Processed Materials',
    Vehicle: 'Vehicles & Transport',
    Boat: 'Vehicles & Transport',
    Package: 'Trade & Commerce',
    'Brico Goods': 'Trade & Commerce',
    'Traveler Goods': 'Trade & Commerce',
    Supplies: 'Trade & Commerce',
    'Hex Coin Sack': 'Currency & Value',
    'Hexite Capsule': 'Currency & Value',
    Energy: 'Special Items'
  }

  return categoryMapping[tag] || 'Other Cargo'
}

/**
 * Get volume category based on cargo volume
 */
function getVolumeCategory(volume: number): string {
  if (volume <= 1000) return 'Small'
  if (volume <= 5000) return 'Medium'
  if (volume <= 10000) return 'Large'
  return 'Extra Large'
}

/**
 * Get movement impact description
 */
function getMovementImpact(movementModifier: number): string {
  if (movementModifier === 0) return 'No Impact'
  if (movementModifier < 0.5) return 'Slight Slowdown'
  if (movementModifier < 1.0) return 'Moderate Slowdown'
  return 'Heavy Slowdown'
}

/**
 * Get pickup difficulty based on time and properties
 */
function getPickupDifficulty(pickUpTime: number, notPickupable: boolean): string {
  if (notPickupable) return 'Cannot Pick Up'
  if (pickUpTime <= 0.5) return 'Easy'
  if (pickUpTime <= 1.0) return 'Moderate'
  if (pickUpTime <= 2.0) return 'Difficult'
  return 'Very Difficult'
}

/**
 * Check if cargo is animal-related
 */
function isAnimalType(tag: string): boolean {
  const animalTags = ['Animal', 'Monster', 'Ocean Fish']
  return animalTags.includes(tag)
}

/**
 * Check if cargo is material-related
 */
function isMaterialType(tag: string): boolean {
  const materialTags = [
    'Timber',
    'Chunk',
    'Ore Chunk',
    'Geode',
    'Roots',
    'Brick Slab',
    'Frame',
    'Sheeting',
    'Tarp',
    'Trunk'
  ]
  return materialTags.includes(tag)
}

/**
 * Check if cargo is vehicle-related
 */
function isVehicleType(tag: string): boolean {
  const vehicleTags = ['Vehicle', 'Boat']
  return vehicleTags.includes(tag)
}

/**
 * Check if cargo is package-related
 */
function isPackageType(tag: string): boolean {
  return tag === 'Package'
}

/**
 * Check if cargo is trading goods
 */
function isTradingGoodsType(tag: string): boolean {
  const tradingTags = ['Brico Goods', 'Traveler Goods', 'Supplies']
  return tradingTags.includes(tag)
}

/**
 * Get all cargo items from static data
 */
export async function getCargoItems(): Promise<CargoDesc[]> {
  const { cargoDesc } = getCargoData()
  return cargoDesc
}

/**
 * Get cargo with computed properties and enriched data
 */
export async function getCargoWithStats(): Promise<CargoWithStats[]> {
  const { cargoDesc } = getCargoData()
  const results: CargoWithStats[] = []

  for (const cargo of cargoDesc) {
    // Calculate computed properties
    const cargoCategory = getCargoCategory(cargo.tag)
    const isTransportable = !cargo.notPickupable
    const isAnimal = isAnimalType(cargo.tag)
    const isMaterial = isMaterialType(cargo.tag)
    const isVehicle = isVehicleType(cargo.tag)
    const isPackage = isPackageType(cargo.tag)
    const isTradingGoods = isTradingGoodsType(cargo.tag)
    const volumeCategory = getVolumeCategory(cargo.volume)
    const movementImpact = getMovementImpact(cargo.movementModifier)
    const pickupDifficulty = getPickupDifficulty(cargo.pickUpTime, cargo.notPickupable)

    results.push({
      ...cargo,
      cargoCategory,
      isTransportable,
      isAnimal,
      isMaterial,
      isVehicle,
      isPackage,
      isTradingGoods,
      volumeCategory,
      movementImpact,
      pickupDifficulty
    })
  }

  return results
}

/**
 * Alias for consistency with other modules
 */
export async function getCargoWithItems(): Promise<CargoWithStats[]> {
  return getCargoWithStats()
}

/**
 * Get cargo grouped by tag, sorted by tier then by name
 */
export async function getCargoGroupedByTag(): Promise<Record<string, CargoWithStats[]>> {
  const cargo = await getCargoWithStats()

  const grouped: Record<string, CargoWithStats[]> = {}

  for (const cargoItem of cargo) {
    const tag = cargoItem.tag
    if (!grouped[tag]) {
      grouped[tag] = []
    }
    grouped[tag].push(cargoItem)
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
 * Get cargo grouped by category
 */
export async function getCargoGroupedByCategory(): Promise<Record<string, CargoWithStats[]>> {
  const cargo = await getCargoWithStats()

  const grouped: Record<string, CargoWithStats[]> = {}

  for (const cargoItem of cargo) {
    const category = cargoItem.cargoCategory
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(cargoItem)
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
 * Get cargo grouped by volume category
 */
export async function getCargoGroupedByVolume(): Promise<Record<string, CargoWithStats[]>> {
  const cargo = await getCargoWithStats()

  const grouped: Record<string, CargoWithStats[]> = {}

  for (const cargoItem of cargo) {
    const volume = cargoItem.volumeCategory
    if (!grouped[volume]) {
      grouped[volume] = []
    }
    grouped[volume].push(cargoItem)
  }

  // Sort each group by volume, then by tier, then by name
  for (const volume in grouped) {
    grouped[volume].sort((a, b) => {
      // First sort by actual volume
      if (a.volume !== b.volume) {
        return a.volume - b.volume
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
 * Get cargo statistics overview with enhanced analysis
 */
export async function getCargoStatistics() {
  const cargo = await getCargoWithStats()
  const cargoByTag = await getCargoGroupedByTag()
  const cargoByCategory = await getCargoGroupedByCategory()
  const cargoByVolume = await getCargoGroupedByVolume()

  const totalCargo = cargo.length
  const tagCount = Object.keys(cargoByTag).length
  const categoryCount = Object.keys(cargoByCategory).length

  // Calculate tier distribution
  const tierDistribution: Record<number, number> = {}
  cargo.forEach((cargoItem) => {
    tierDistribution[cargoItem.tier] = (tierDistribution[cargoItem.tier] || 0) + 1
  })

  // Calculate rarity distribution
  const rarityDistribution: Record<string, number> = {}
  cargo.forEach((cargoItem) => {
    const rarity = cargoItem.rarity?.tag || 'Unknown'
    rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1
  })

  // Calculate category distribution
  const categoryDistribution: Record<string, number> = {}
  cargo.forEach((cargoItem) => {
    categoryDistribution[cargoItem.cargoCategory] = (categoryDistribution[cargoItem.cargoCategory] || 0) + 1
  })

  // Calculate volume distribution
  const volumeDistribution: Record<string, number> = {}
  cargo.forEach((cargoItem) => {
    volumeDistribution[cargoItem.volumeCategory] = (volumeDistribution[cargoItem.volumeCategory] || 0) + 1
  })

  // Calculate type counts
  const animalCount = cargo.filter((c) => c.isAnimal).length
  const materialCount = cargo.filter((c) => c.isMaterial).length
  const vehicleCount = cargo.filter((c) => c.isVehicle).length
  const packageCount = cargo.filter((c) => c.isPackage).length
  const tradingGoodsCount = cargo.filter((c) => c.isTradingGoods).length
  const transportableCount = cargo.filter((c) => c.isTransportable).length

  // Calculate volume statistics
  const volumes = cargo.map((c) => c.volume)
  const volumeStats =
    volumes.length > 0
      ? {
          minVolume: Math.min(...volumes),
          maxVolume: Math.max(...volumes),
          avgVolume: Math.round(volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length)
        }
      : {
          minVolume: 0,
          maxVolume: 0,
          avgVolume: 0
        }

  return {
    total: totalCargo,
    tags: tagCount,
    categories: categoryCount,
    animalCount,
    materialCount,
    vehicleCount,
    packageCount,
    tradingGoodsCount,
    transportableCount,
    tierDistribution,
    rarityDistribution,
    categoryDistribution,
    volumeDistribution,
    volumeStats,
    cargoByTag: Object.entries(cargoByTag).map(([tag, cargoList]) => ({
      tag,
      count: cargoList.length,
      category: cargoList[0]?.cargoCategory || 'Unknown',
      avgVolume:
        cargoList.length > 0 ? Math.round(cargoList.reduce((sum, c) => sum + c.volume, 0) / cargoList.length) : 0
    })),
    cargoByCategory: Object.entries(cargoByCategory).map(([category, cargoList]) => ({
      category,
      count: cargoList.length,
      avgTier: cargoList.length > 0 ? Math.round(cargoList.reduce((sum, c) => sum + c.tier, 0) / cargoList.length) : 0,
      avgVolume:
        cargoList.length > 0 ? Math.round(cargoList.reduce((sum, c) => sum + c.volume, 0) / cargoList.length) : 0
    })),
    cargoByVolume: Object.entries(cargoByVolume).map(([volume, cargoList]) => ({
      volume,
      count: cargoList.length
    }))
  }
}

