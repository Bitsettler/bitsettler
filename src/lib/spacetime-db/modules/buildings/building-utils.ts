import type { BuildingDesc } from '@/data/bindings/building_desc_type'
import type { BuildingFunction } from '@/data/bindings/building_function_type'
import type { BuildingTypeDesc } from '@/data/bindings/building_type_desc_type'
import type { ConstructionRecipeDesc } from '@/data/bindings/construction_recipe_desc_type'
import type { DeconstructionRecipeDesc } from '@/data/bindings/deconstruction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'

// BuildingCategory enum mapping based on the SpacetimeDB enum indices
export const BUILDING_CATEGORY_MAPPING: Record<number, string> = {
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
export const BUILDING_FUNCTION_TYPE_MAPPING: Record<number, string> = {
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
  formattedFunctions: string
  parsedFunctions: BuildingFunction[]
  isWilderness: boolean
  isDestructible: boolean
  hasMaintenanceCost: boolean
  totalSlots: number
}

// Alias for consistency with other modules
export type BuildingWithItem = BuildingWithConstructionInfo

/**
 * Format building functions using proper BuildingFunction types
 */
export function formatBuildingFunctions(functions: unknown[]): string {
  if (!functions || functions.length === 0) {
    return 'None'
  }

  const functionDescriptions: string[] = []

  for (const func of functions) {
    // Handle both proper typed format and raw JSON array format
    let buildingFunc: BuildingFunction | null = null

    if (typeof func === 'object' && func !== null && !Array.isArray(func)) {
      // Proper typed format
      buildingFunc = func as BuildingFunction
    } else if (Array.isArray(func) && func.length >= 16) {
      // Raw JSON array format: [functionType, level, craftingSlots, storageSlots, cargoSlots, refiningSlots, refiningCargoSlots, itemSlotSize, cargoSlotSize, tradeOrders, allowedItemIdPerSlot, buffIds, concurrentCraftsPerPlayer, terraform, housingSlots, housingIncome]
      buildingFunc = {
        functionType: func[0] as number,
        level: func[1] as number,
        craftingSlots: func[2] as number,
        storageSlots: func[3] as number,
        cargoSlots: func[4] as number,
        refiningSlots: func[5] as number,
        refiningCargoSlots: func[6] as number,
        itemSlotSize: func[7] as number,
        cargoSlotSize: func[8] as number,
        tradeOrders: func[9] as number,
        allowedItemIdPerSlot: func[10] as number[],
        buffIds: func[11] as number[],
        concurrentCraftsPerPlayer: func[12] as number,
        terraform: func[13] as boolean,
        housingSlots: func[14] as number,
        housingIncome: func[15] as number
      }
    }

    if (!buildingFunc) continue

    const descriptions = formatSingleBuildingFunction(buildingFunc)
    if (descriptions.length > 0) {
      functionDescriptions.push(descriptions.join(', '))
    }
  }

  return functionDescriptions.length > 0 ? functionDescriptions.join(' | ') : 'None'
}

/**
 * Format a single building function with proper type safety
 */
function formatSingleBuildingFunction(func: BuildingFunction): string[] {
  const descriptions: string[] = []

  // Check for crafting functionality
  if (func.craftingSlots > 0) {
    descriptions.push(`Crafting (${func.craftingSlots} slots)`)
  }

  // Check for storage functionality
  if (func.storageSlots > 0) {
    descriptions.push(`Storage (${func.storageSlots} slots)`)
  }

  // Check for cargo functionality
  if (func.cargoSlots > 0) {
    descriptions.push(`Cargo (${func.cargoSlots} slots)`)
  }

  // Check for refining functionality
  if (func.refiningSlots > 0) {
    descriptions.push(`Refining (${func.refiningSlots} slots)`)
  }

  // Check for housing functionality
  if (func.housingSlots > 0) {
    descriptions.push(`Housing (${func.housingSlots} slots)`)
  }

  // Check for trade functionality
  if (func.tradeOrders > 0) {
    descriptions.push(`Trading (${func.tradeOrders} orders)`)
  }

  // Check for terraforming
  if (func.terraform) {
    descriptions.push('Terraforming')
  }

  // If no specific functions found, use function type name
  if (descriptions.length === 0) {
    const functionTypeName = BUILDING_FUNCTION_TYPE_MAPPING[func.functionType] || 'General'
    descriptions.push(functionTypeName)
  }

  return descriptions
}

/**
 * Parse building functions from unknown format to BuildingFunction array
 */
export function parseBuildingFunctions(functions: unknown[]): BuildingFunction[] {
  if (!functions || functions.length === 0) {
    return []
  }

  const parsedFunctions: BuildingFunction[] = []

  for (const func of functions) {
    let buildingFunc: BuildingFunction | null = null

    if (typeof func === 'object' && func !== null && !Array.isArray(func)) {
      // Proper typed format
      buildingFunc = func as BuildingFunction
    } else if (Array.isArray(func) && func.length >= 16) {
      // Raw JSON array format
      buildingFunc = {
        functionType: func[0] as number,
        level: func[1] as number,
        craftingSlots: func[2] as number,
        storageSlots: func[3] as number,
        cargoSlots: func[4] as number,
        refiningSlots: func[5] as number,
        refiningCargoSlots: func[6] as number,
        itemSlotSize: func[7] as number,
        cargoSlotSize: func[8] as number,
        tradeOrders: func[9] as number,
        allowedItemIdPerSlot: func[10] as number[],
        buffIds: func[11] as number[],
        concurrentCraftsPerPlayer: func[12] as number,
        terraform: func[13] as boolean,
        housingSlots: func[14] as number,
        housingIncome: func[15] as number
      }
    }

    if (buildingFunc) {
      parsedFunctions.push(buildingFunc)
    }
  }

  return parsedFunctions
}

/**
 * Calculate total slots for a building across all functions
 */
export function calculateTotalSlots(functions: BuildingFunction[]): number {
  return functions.reduce((total, func) => {
    return total + func.craftingSlots + func.storageSlots + func.cargoSlots + func.refiningSlots + func.housingSlots
  }, 0)
}
