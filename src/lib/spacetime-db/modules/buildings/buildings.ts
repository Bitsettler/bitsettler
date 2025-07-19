// Re-export all buildings functionality from the proper modules
export { type BuildingWithConstructionInfo, type BuildingWithItem } from './building-utils'

// Export main functions for backward compatibility
export { getBuildingsWithConstructionInfo } from './flows'
export { getBuildingsGroupedByCategory, getBuildingsGroupedByLocation, getBuildingsGroupedByFunction } from './flows'
export { getBuildingStatistics } from './flows'

// Export commands for direct access
export { getAllBuildings, getBuildings } from './commands'
export { getBuildingData, getConstructionRecipes, getDeconstructionRecipes, getWritItems } from './commands'

// Legacy functions for backward compatibility
export async function getDestructibleBuildings() {
  const { getBuildingsWithConstructionInfo } = await import('./flows')
  const buildings = await getBuildingsWithConstructionInfo()
  return buildings.filter((building) => building.isDestructible)
}

export async function getBuildingsWithMaintenance() {
  const { getBuildingsWithConstructionInfo } = await import('./flows')
  const buildings = await getBuildingsWithConstructionInfo()
  return buildings.filter((building) => building.hasMaintenanceCost)
}

export async function getBuildingsByFunctionType(functionType: number) {
  const { getBuildingsWithConstructionInfo } = await import('./flows')
  const buildings = await getBuildingsWithConstructionInfo()
  return buildings.filter((building) => building.parsedFunctions.some((func) => func.functionType === functionType))
}

export async function getWritsGroupedByTag() {
  const { getWritItems } = await import('./commands')
  const writs = getWritItems()

  const grouped: Record<string, any[]> = {}

  for (const writ of writs) {
    const tag = writ.tag
    if (!grouped[tag]) {
      grouped[tag] = []
    }
    grouped[tag].push(writ)
  }

  // Sort each group by tier
  for (const tag in grouped) {
    grouped[tag].sort((a, b) => a.tier - b.tier)
  }

  return grouped
}