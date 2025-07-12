// Type definitions
export type { BaseEntity, CompendiumEntity, EntityType } from './types'

// Profession utilities
export {
  getAllProfessions,
  getProfessionById,
  getProfessionBySlug,
  getProfessionStats,
  getProfessionsByCategory,
  getProfessionsByType
} from './professions'
export type { Profession } from './professions'

// Rarity utilities
export { convertRarityArrayToString, convertRarityToString, getRarityColor, getRarityDisplayName } from './rarity'

// Asset utilities
export { assetExists, cleanIconAssetName, getFallbackIconPath, getServerIconPath } from './assets'

// Tag/Category utilities
export {
  extractUniqueCategories,
  getCategoryColor,
  getCategoryStats,
  groupEntitiesByCategory,
  normalizeCategoryName
} from './tags'

// General entity utilities
export {
  convertToCompendiumEntity,
  createSlug,
  extractUniqueEntityTypes,
  filterByCategory,
  filterByEntityType,
  filterByRarity,
  filterBySearch,
  filterByTierRange,
  getEntityStats,
  getTierColor,
  sortEntitiesByName,
  sortEntitiesByRarity,
  sortEntitiesByTier
} from './entities'

// Cargo-specific utilities
export {
  filterAnimals,
  filterPackages,
  filterToCargo,
  filterTravelerGoods,
  filterVehicles,
  getCargoStatsByCategory,
  getCargoTierDistribution,
  getCargoVolumeDistribution,
  isTransportable
} from './items/cargo'

// Resource-specific utilities
export {
  filterHarvestables,
  filterMineables,
  filterOreVeins,
  filterPlants,
  filterToResources,
  filterTrees,
  getHarvestingSkill,
  getResourceStatsByCategory,
  getResourceTierDistribution,
  getResourceYield,
  isRenewable
} from './resources'
