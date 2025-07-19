import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getBuildingData } from '../commands/get-building-data'
import {
  type BuildingWithConstructionInfo,
  BUILDING_CATEGORY_MAPPING,
  parseBuildingFunctions,
  formatBuildingFunctions,
  calculateTotalSlots
} from '../building-utils'

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
  } = getBuildingData()

  const buildings = buildingDesc.filter((building) => building.showInCompendium)
  const results: BuildingWithConstructionInfo[] = []

  // Create a lookup map for building types and categories
  const buildingIdToTypeMap = new Map()

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

    // Parse and format building functions with proper typing
    const parsedFunctions = parseBuildingFunctions(building.functions || [])
    const formattedFunctions = formatBuildingFunctions(building.functions || [])

    // Calculate computed properties
    const totalSlots = calculateTotalSlots(parsedFunctions)
    const isWilderness = building.wilderness
    const isDestructible = !building.notDeconstructible
    const hasMaintenanceCost = building.maintenance > 0

    results.push({
      ...building,
      constructionRecipe,
      deconstructionRecipe,
      writItems: writItems.length > 0 ? writItems : undefined,
      buildingType,
      category,
      formattedFunctions,
      parsedFunctions,
      isWilderness,
      isDestructible,
      hasMaintenanceCost,
      totalSlots
    })
  }

  return results
}