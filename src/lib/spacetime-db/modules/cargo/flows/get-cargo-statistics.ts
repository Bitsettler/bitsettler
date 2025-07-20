import { getCargoGroupedByCategory, getCargoGroupedByTag, getCargoGroupedByVolume } from './get-cargo-grouped'
import { getCargoWithStats } from './get-cargo-with-stats'

/**
 * Get cargo statistics overview with enhanced analysis
 */
export function getCargoStatistics() {
  const cargo = getCargoWithStats()
  const cargoByTag = getCargoGroupedByTag()
  const cargoByCategory = getCargoGroupedByCategory()
  const cargoByVolume = getCargoGroupedByVolume()

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

  // Calculate volume distribution (raw game values)
  const volumeDistribution: Record<string, number> = {}
  cargo.forEach((cargoItem) => {
    const volume = cargoItem.volume.toString()
    volumeDistribution[volume] = (volumeDistribution[volume] || 0) + 1
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
