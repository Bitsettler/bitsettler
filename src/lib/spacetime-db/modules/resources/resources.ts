// Re-export all resources functionality from the proper modules
export { type ResourceWithStats } from './flows/get-resources-with-stats'

// Export main functions for backward compatibility
export {
  getResourceStatistics,
  getResourcesGroupedByBiome,
  getResourcesGroupedByCategory,
  getResourcesGroupedByTag,
  getResourcesWithItems,
  getResourcesWithStats
} from './flows'

// Export commands for direct access
export {
  getAllResources,
  getResourceItems,
  mapResourceToCalculatorItem,
  mapResourceToSearchItem,
  transformResourcesToCalculator,
  transformResourcesToSearch
} from './commands'
