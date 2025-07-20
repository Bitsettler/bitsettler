// Re-export all collectibles functionality from the proper modules
export { type CollectibleWithItem } from './collectible-utils'

// Export main functions for backward compatibility
export {
  getCollectibleStatistics,
  getCollectiblesGroupedByCategory,
  getCollectiblesGroupedByRarity,
  getCollectiblesGroupedByTag,
  getCollectiblesGroupedByType,
  getCollectiblesWithItems,
  getCollectiblesWithStats
} from './flows'

// Export commands for direct access
export { getCollectibleData, getCollectibleItems, getCollectibleStats } from './commands'
