import { getBuildingsWithConstructionInfo } from './get-buildings-with-construction-info'
import { getBuildingsGroupedByCategory, getBuildingsGroupedByLocation } from './get-buildings-grouped'
import { getConstructionRecipes, getWritItems } from '../commands/get-building-data'
import { BUILDING_FUNCTION_TYPE_MAPPING } from '../building-utils'

/**
 * Get building statistics overview with enhanced analysis
 */
export async function getBuildingStatistics() {
  const buildings = await getBuildingsWithConstructionInfo()
  const writs = getWritItems()
  const constructionRecipes = getConstructionRecipes()
  const buildingsByCategory = await getBuildingsGroupedByCategory()
  const buildingsByLocation = await getBuildingsGroupedByLocation()

  const totalBuildings = buildings.length
  const totalWrits = writs.length
  const totalConstructionRecipes = constructionRecipes.length
  const categoryCount = Object.keys(buildingsByCategory).length

  // Calculate category distribution
  const buildingCategoryDistribution: Record<string, number> = {}
  buildings.forEach((building) => {
    const categoryName = building.category || 'Uncategorized'
    buildingCategoryDistribution[categoryName] = (buildingCategoryDistribution[categoryName] || 0) + 1
  })

  // Calculate writ tier distribution
  const writTierDistribution: Record<number, number> = {}
  writs.forEach((writ) => {
    writTierDistribution[writ.tier] = (writTierDistribution[writ.tier] || 0) + 1
  })

  // Calculate building characteristics
  const wildernessBuildings = buildings.filter((b) => b.isWilderness).length
  const settlementBuildings = buildings.filter((b) => !b.isWilderness).length
  const destructibleBuildings = buildings.filter((b) => b.isDestructible).length
  const buildingsWithMaintenance = buildings.filter((b) => b.hasMaintenanceCost).length

  // Calculate slot statistics
  const totalSlots = buildings.reduce((sum, b) => sum + b.totalSlots, 0)
  const avgSlotsPerBuilding = buildings.length > 0 ? Math.round(totalSlots / buildings.length) : 0
  const maxSlots = Math.max(...buildings.map((b) => b.totalSlots))

  // Calculate function type distribution
  const functionTypeDistribution: Record<string, number> = {}
  buildings.forEach((building) => {
    building.parsedFunctions.forEach((func) => {
      const functionTypeName = BUILDING_FUNCTION_TYPE_MAPPING[func.functionType] || 'General'
      functionTypeDistribution[functionTypeName] = (functionTypeDistribution[functionTypeName] || 0) + 1
    })
  })

  // Calculate maintenance statistics
  const maintenanceCosts = buildings.filter((b) => b.hasMaintenanceCost).map((b) => b.maintenance)
  const avgMaintenance =
    maintenanceCosts.length > 0
      ? Math.round((maintenanceCosts.reduce((sum, cost) => sum + cost, 0) / maintenanceCosts.length) * 100) / 100
      : 0

  return {
    totalBuildings,
    totalWrits,
    totalConstructionRecipes,
    categories: categoryCount,
    wildernessBuildings,
    settlementBuildings,
    destructibleBuildings,
    buildingsWithMaintenance,
    totalSlots,
    avgSlotsPerBuilding,
    maxSlots,
    avgMaintenance,
    buildingCategoryDistribution,
    writTierDistribution,
    functionTypeDistribution,
    buildingsByCategory: Object.entries(buildingsByCategory).map(([category, buildings]) => ({
      category,
      count: buildings.length,
      avgSlots:
        buildings.length > 0 ? Math.round(buildings.reduce((sum, b) => sum + b.totalSlots, 0) / buildings.length) : 0
    })),
    buildingsByLocation: Object.entries(buildingsByLocation).map(([location, buildings]) => ({
      location,
      count: buildings.length
    }))
  }
}