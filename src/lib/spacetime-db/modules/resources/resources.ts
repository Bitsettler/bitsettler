// Re-export all resources functionality from the proper modules
export { type ResourceWithStats } from './flows/get-resources-with-stats'

// Export main functions for backward compatibility
export { getResourcesWithStats, getResourcesWithItems } from './flows'
export { getResourcesGroupedByTag, getResourcesGroupedByCategory, getResourcesGroupedByBiome } from './flows'
export { getResourceStatistics } from './flows'

// Export commands for direct access
export { getAllResources, getResourceItems } from './commands'
export { mapResourceToCalculatorItem, transformResourcesToCalculator } from './commands'
export { mapResourceToSearchItem, transformResourcesToSearch } from './commands'