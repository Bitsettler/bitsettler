import type { BuildingDesc } from '@/data/bindings/building_desc_type'
import type { BuildingFunctionTypeMappingDesc } from '@/data/bindings/building_function_type_mapping_desc_type'
import type { BuildingTypeDesc } from '@/data/bindings/building_type_desc_type'
import type { ConstructionRecipeDesc } from '@/data/bindings/construction_recipe_desc_type'
import type { DeconstructionRecipeDesc } from '@/data/bindings/deconstruction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import buildingDescData from '@/data/global/building_desc.json'
import buildingFunctionTypeMappingDescData from '@/data/global/building_function_type_mapping_desc.json'
import buildingTypeDescData from '@/data/global/building_type_desc.json'
import constructionRecipeDescData from '@/data/global/construction_recipe_desc.json'
import deconstructionRecipeDescData from '@/data/global/deconstruction_recipe_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// BuildingCategory enum mapping based on the SpacetimeDB enum indices
const BUILDING_CATEGORY_MAPPING: Record<number, string> = {
  0: 'Storage',
  1: 'Crafting',
  2: 'Residential',
  3: 'TownHall',
  4: 'Wall',
  5: 'TradingPost',
  6: 'Ornamental',
  7: 'AncientRuins',
  8: 'ClaimTotem',
  9: 'TerrraformingBase',
  10: 'Barter',
  11: 'Portal',
  12: 'RentTerminal',
  13: 'Watchtower',
  14: 'EmpireFoundry',
  15: 'Sign',
  16: 'Gate',
  17: 'Bed',
  18: 'Waystone',
  19: 'Bank',
  20: 'Elevator',
  21: 'TownMarket',
  22: 'RecoveryChest',
  23: 'PlayerHousing'
}

// Simple function type mapping based on functionality
const BUILDING_FUNCTION_TYPE_MAPPING: Record<number, string> = {
  0: 'General',
  1: 'Crafting',
  2: 'Storage',
  3: 'Housing',
  4: 'Refining',
  5: 'Trading'
}

// Combined building data with construction information and category
export interface BuildingWithConstructionInfo extends BuildingDesc {
  constructionRecipe?: ConstructionRecipeDesc
  deconstructionRecipe?: DeconstructionRecipeDesc
  writItems?: ItemDesc[]
  buildingType?: BuildingTypeDesc
  category?: string
  formattedFunctions?: string
}

// Alias for consistency with other modules
export type BuildingWithItem = BuildingWithConstructionInfo

// Helper function to format building functions based on available data
// SpacetimeDB BuildingFunction array format: [functionType, level, craftingSlots, storageSlots, cargoSlots, refiningSlots, refiningCargoSlots, itemSlotSize, cargoSlotSize, tradeOrders, allowedItemIdPerSlot, buffIds, concurrentCraftsPerPlayer, terraform, housingSlots, housingIncome]
function formatBuildingFunctions(functions: unknown[]): string {
  if (!functions || functions.length === 0) {
    return 'None'
  }

  const functionDescriptions: string[] = []

  for (const func of functions) {
    // Ensure func is an array before destructuring
    if (!Array.isArray(func)) continue

    // Parse the array format into named fields
    const [
      functionType, // 0
      // 1 - level (unused)
      ,
      craftingSlots, // 2
      storageSlots, // 3
      cargoSlots, // 4
      refiningSlots, // 5
      // 6 - refiningCargoSlots (unused)
      // 7 - itemSlotSize (unused)
      // 8 - cargoSlotSize (unused)
      ,
      ,
      ,
      tradeOrders, // 9
      // 10 - allowedItemIdPerSlot (unused)
      // 11 - buffIds (unused)
      // 12 - concurrentCraftsPerPlayer (unused)
      ,
      ,
      ,
      terraform, // 13
      housingSlots // 14
      // 15 - housingIncome (unused)
    ] = func

    const descriptions: string[] = []

    // Check for crafting functionality
    if (craftingSlots > 0) {
      descriptions.push(`Crafting (${craftingSlots} slots)`)
    }

    // Check for storage functionality
    if (storageSlots > 0) {
      descriptions.push(`Storage (${storageSlots} slots)`)
    }

    // Check for cargo functionality
    if (cargoSlots > 0) {
      descriptions.push(`Cargo (${cargoSlots} slots)`)
    }

    // Check for refining functionality
    if (refiningSlots > 0) {
      descriptions.push(`Refining (${refiningSlots} slots)`)
    }

    // Check for housing functionality
    if (housingSlots > 0) {
      descriptions.push(`Housing (${housingSlots} slots)`)
    }

    // Check for trade functionality
    if (tradeOrders > 0) {
      descriptions.push(`Trading (${tradeOrders} orders)`)
    }

    // Check for terraforming
    if (terraform) {
      descriptions.push('Terraforming')
    }

    // If no specific functions found, use function type ID
    if (descriptions.length === 0) {
      descriptions.push(`Function Type ${functionType}`)
    }

    functionDescriptions.push(descriptions.join(', '))
  }

  return functionDescriptions.join(' | ')
}

/**
 * Get building-related data from static JSON files
 */
function getBuildingData() {
  return {
    buildingDesc: camelCaseDeep<BuildingDesc[]>(buildingDescData),
    buildingTypeDesc: camelCaseDeep<BuildingTypeDesc[]>(buildingTypeDescData),
    buildingFunctionTypeMappingDesc: camelCaseDeep<BuildingFunctionTypeMappingDesc[]>(
      buildingFunctionTypeMappingDescData
    ),
    constructionRecipeDesc: camelCaseDeep<ConstructionRecipeDesc[]>(constructionRecipeDescData),
    deconstructionRecipeDesc: camelCaseDeep<DeconstructionRecipeDesc[]>(deconstructionRecipeDescData),
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData)
  }
}

/**
 * Alias for getBuildingData to maintain compatibility
 */
async function fetchBuildingData() {
  return getBuildingData()
}

/**
 * Get all buildings from live data
 */
export async function getBuildings(): Promise<BuildingDesc[]> {
  const { buildingDesc } = getBuildingData()
  return buildingDesc.filter((building) => building.showInCompendium)
}

/**
 * Get all Writ items from live data
 */
export async function getWritItems(): Promise<ItemDesc[]> {
  const { itemDesc } = await fetchBuildingData()
  return itemDesc.filter((item) => item.compendiumEntry && item.tag === 'Writ')
}

/**
 * Get all construction recipes from live data
 */
export async function getConstructionRecipes(): Promise<ConstructionRecipeDesc[]> {
  const { constructionRecipeDesc } = await fetchBuildingData()
  return constructionRecipeDesc
}

/**
 * Get all deconstruction recipes from live data
 */
export async function getDeconstructionRecipes(): Promise<DeconstructionRecipeDesc[]> {
  const { deconstructionRecipeDesc } = await fetchBuildingData()
  return deconstructionRecipeDesc
}

/**
 * Get buildings enriched with construction information and categories
 */
export async function getBuildingsWithConstructionInfo(): Promise<BuildingWithConstructionInfo[]> {
  const {
    buildingDesc,
    buildingTypeDesc,
    buildingFunctionTypeMappingDesc,
    constructionRecipeDesc,
    deconstructionRecipeDesc,
    itemDesc
  } = await fetchBuildingData()

  const buildings = buildingDesc.filter((building) => building.showInCompendium)
  const results: BuildingWithConstructionInfo[] = []

  // Create a lookup map for building types and categories
  const buildingIdToTypeMap = new Map<number, BuildingTypeDesc>()

  for (const mapping of buildingFunctionTypeMappingDesc) {
    const buildingType = buildingTypeDesc.find((type) => type.id === mapping.typeId)
    if (buildingType) {
      for (const buildingId of mapping.descIds) {
        buildingIdToTypeMap.set(buildingId, buildingType)
      }
    }
  }

  for (const building of buildings) {
    // Find construction recipe that references this building
    const constructionRecipe = constructionRecipeDesc.find((recipe) => recipe.buildingDescriptionId === building.id)

    // Find deconstruction recipe that references this building
    const deconstructionRecipe = deconstructionRecipeDesc.find((recipe) => recipe.consumedBuilding === building.id)

    // Find Writ items that are consumed in the construction of this building
    let writItems: ItemDesc[] = []
    if (constructionRecipe) {
      const consumedItemIds = constructionRecipe.consumedItemStacks?.map((stack) => stack.itemId) || []
      writItems = itemDesc.filter((item) => consumedItemIds.includes(item.id) && item.tag === 'Writ')
    }

    // Find building type and category
    const buildingType = buildingIdToTypeMap.get(building.id)
    // Extract category from the SpacetimeDB enum structure: [index, {}]
    const categoryIndex = Array.isArray(buildingType?.category) ? buildingType.category[0] : undefined
    const category = typeof categoryIndex === 'number' ? BUILDING_CATEGORY_MAPPING[categoryIndex] : undefined

    // Format building functions
    const formattedFunctions = formatBuildingFunctions(building.functions || [])

    results.push({
      ...building,
      constructionRecipe,
      deconstructionRecipe,
      writItems: writItems.length > 0 ? writItems : undefined,
      buildingType,
      category,
      formattedFunctions
    })
  }

  return results
}

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

/**
 * Get Writs grouped by tag
 */
export async function getWritsGroupedByTag(): Promise<Record<string, ItemDesc[]>> {
  const writs = await getWritItems()

  const grouped: Record<string, ItemDesc[]> = {}

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

/**
 * Get building statistics overview
 */
export async function getBuildingStatistics() {
  const buildings = await getBuildingsWithConstructionInfo()
  const writs = await getWritItems()
  const constructionRecipes = await getConstructionRecipes()
  const buildingsByCategory = await getBuildingsGroupedByCategory()

  const totalBuildings = buildings.length
  const totalWrits = writs.length
  const totalConstructionRecipes = constructionRecipes.length
  const categoryCount = Object.keys(buildingsByCategory).length

  const buildingCategoryDistribution: Record<string, number> = {}
  buildings.forEach((building) => {
    const categoryName = building.category || 'Uncategorized'
    buildingCategoryDistribution[categoryName] = (buildingCategoryDistribution[categoryName] || 0) + 1
  })

  const writTierDistribution: Record<number, number> = {}
  writs.forEach((writ) => {
    writTierDistribution[writ.tier] = (writTierDistribution[writ.tier] || 0) + 1
  })

  return {
    totalBuildings,
    totalWrits,
    totalConstructionRecipes,
    categories: categoryCount,
    buildingCategoryDistribution,
    writTierDistribution,
    buildingsByCategory: Object.entries(buildingsByCategory).map(([category, buildings]) => ({
      category,
      count: buildings.length
    }))
  }
}
