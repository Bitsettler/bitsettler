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
import { camelCaseDeep } from '../../../shared/utils/case-utils'

/**
 * Get all building-related data from static JSON files
 */
export function getBuildingData() {
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
 * Get all construction recipes
 */
export function getConstructionRecipes(): ConstructionRecipeDesc[] {
  const { constructionRecipeDesc } = getBuildingData()
  return constructionRecipeDesc
}

/**
 * Get all deconstruction recipes
 */
export function getDeconstructionRecipes(): DeconstructionRecipeDesc[] {
  const { deconstructionRecipeDesc } = getBuildingData()
  return deconstructionRecipeDesc
}

/**
 * Get all Writ items
 */
export function getWritItems(): ItemDesc[] {
  const { itemDesc } = getBuildingData()
  return itemDesc.filter((item) => item.compendiumEntry && item.tag === 'Writ')
}