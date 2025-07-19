import { getBuildingsWithConstructionInfo } from './get-buildings-with-construction-info'
import type { BuildingWithConstructionInfo } from '../building-utils'
import { BUILDING_FUNCTION_TYPE_MAPPING } from '../building-utils'

/**
 * Get buildings grouped by category
 */
export async function getBuildingsGroupedByCategory(): Promise<Record<string, BuildingWithConstructionInfo[]>> {
  const buildings = await getBuildingsWithConstructionInfo()

  const grouped: Record<string, BuildingWithConstructionInfo[]> = {}

  for (const building of buildings) {
    // Group by building category, fallback to "Uncategorized"
    const categoryName = building.category || 'Uncategorized'

    if (!grouped[categoryName]) {
      grouped[categoryName] = []
    }
    grouped[categoryName].push(building)
  }

  // Sort each group by name
  for (const categoryName in grouped) {
    grouped[categoryName].sort((a, b) => a.name.localeCompare(b.name))
  }

  return grouped
}

/**
 * Get buildings grouped by wilderness vs settlement
 */
export async function getBuildingsGroupedByLocation(): Promise<Record<string, BuildingWithConstructionInfo[]>> {
  const buildings = await getBuildingsWithConstructionInfo()

  const grouped: Record<string, BuildingWithConstructionInfo[]> = {
    'Wilderness Buildings': [],
    'Settlement Buildings': []
  }

  for (const building of buildings) {
    const locationName = building.isWilderness ? 'Wilderness Buildings' : 'Settlement Buildings'
    grouped[locationName].push(building)
  }

  // Sort each group by category, then by name
  for (const location in grouped) {
    grouped[location].sort((a, b) => {
      // First sort by category
      if (a.category !== b.category) {
        return (a.category || 'Uncategorized').localeCompare(b.category || 'Uncategorized')
      }
      // Then sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get buildings grouped by function (legacy function for backward compatibility)
 */
export async function getBuildingsGroupedByFunction(): Promise<Record<string, BuildingWithConstructionInfo[]>> {
  const buildings = await getBuildingsWithConstructionInfo()

  const grouped: Record<string, BuildingWithConstructionInfo[]> = {}

  for (const building of buildings) {
    // Group by the first function if available, otherwise use "General"
    // Since functions are arrays, get the first element (functionType) and map it to category
    let functionName = 'General'
    if (building.functions && building.functions.length > 0) {
      const firstFunction = building.functions[0]
      if (Array.isArray(firstFunction) && firstFunction.length > 0) {
        const functionType = firstFunction[0]
        functionName =
          typeof functionType === 'number' ? BUILDING_FUNCTION_TYPE_MAPPING[functionType] || 'General' : 'General'
      }
    }

    if (!grouped[functionName]) {
      grouped[functionName] = []
    }
    grouped[functionName].push(building)
  }

  // Sort each group by name
  for (const functionName in grouped) {
    grouped[functionName].sort((a, b) => a.name.localeCompare(b.name))
  }

  return grouped
}