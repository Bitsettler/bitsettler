// Re-export all cargo functionality from the proper modules
export { type CargoWithStats } from './flows/get-cargo-with-stats'

// Export main functions for backward compatibility
export { getCargoWithStats, getCargoWithItems } from './flows'
export { getCargoGroupedByTag, getCargoGroupedByCategory, getCargoGroupedByVolume } from './flows'
export { getCargoStatistics } from './flows'

// Export commands for direct access
export { getAllCargo } from './commands'
export { mapCargoToCalculatorItem, transformCargoToCalculator } from './commands'
export { mapCargoToSearchItem, transformCargoToSearch } from './commands'

// Note: getCargoItems was a duplicate of getAllCargo, use getAllCargo instead