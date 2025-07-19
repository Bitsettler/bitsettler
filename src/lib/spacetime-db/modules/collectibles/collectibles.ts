// Re-export all collectibles functionality from the proper modules
export { type CollectibleWithItem } from './collectible-utils'

// Export main functions for backward compatibility
export { getCollectiblesWithStats, getCollectiblesWithItems } from './flows'
export { getCollectiblesGroupedByTag, getCollectiblesGroupedByType, getCollectiblesGroupedByRarity, getCollectiblesGroupedByCategory } from './flows'
export { getCollectibleStatistics } from './flows'

// Export commands for direct access
export { getCollectibleData, getCollectibleItems, getCollectibleStats } from './commands'