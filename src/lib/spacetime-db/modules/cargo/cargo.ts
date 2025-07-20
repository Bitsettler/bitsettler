// Re-export all cargo functionality from the proper modules
export { type CargoWithStats } from './flows/get-cargo-with-stats'

// Export main functions for backward compatibility
export {
  getCargoGroupedByCategory,
  getCargoGroupedByTag,
  getCargoGroupedByVolume,
  getCargoStatistics,
  getCargoWithItems,
  getCargoWithStats
} from './flows'

// Export commands for direct access
export {
  getAllCargo,
  mapCargoToCalculatorItem,
  mapCargoToSearchItem,
  transformCargoToCalculator,
  transformCargoToSearch
} from './commands'

// Note: getCargoItems was a duplicate of getAllCargo, use getAllCargo instead
