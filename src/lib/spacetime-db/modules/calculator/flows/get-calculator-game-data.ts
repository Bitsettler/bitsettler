import { getAllCargo } from '@/lib/spacetime-db/modules/cargo/commands/get-all-cargo'
import { mapCargoToCalculatorItem, transformCargoToCalculator } from '@/lib/spacetime-db/modules/cargo/cargo'
import { getAllCraftingRecipes } from '@/lib/spacetime-db/modules/crafting-recipes/commands/get-all-crafting-recipes'
import { getAllExtractionRecipes } from '@/lib/spacetime-db/modules/extraction-recipes/commands/get-all-extraction-recipes'
import { getAllItemLists } from '@/lib/spacetime-db/modules/item-lists/commands/get-all-item-lists'
import { getAllItems } from '@/lib/spacetime-db/modules/items/commands/get-all-items'
import { mapItemToCalculatorItem, transformItemsToCalculator } from '@/lib/spacetime-db/modules/items/commands'
import {
  transformCraftingRecipesToCalculator,
  transformExtractionRecipesToCalculator
} from '@/lib/spacetime-db/modules/recipes/calculator'
import { getAllResources } from '@/lib/spacetime-db/modules/resources/commands/get-all-resources'
import { mapResourceToCalculatorItem, transformResourcesToCalculator } from '@/lib/spacetime-db/modules/resources/commands'
import { createUnifiedLookup, shouldFilterItem } from '@/lib/spacetime-db/shared/calculator-utils'
import type { CalculatorGameData } from '@/lib/spacetime-db/shared/dtos/calculator-dtos'

/**
 * Get processed calculator game data for the calculator functionality
 */
export function getCalculatorGameData(): CalculatorGameData {
  const itemDesc = getAllItems()
  const cargoDesc = getAllCargo()
  const resourceDesc = getAllResources()
  const craftingRecipeDesc = getAllCraftingRecipes()
  const extractionRecipeDesc = getAllExtractionRecipes()
  const itemListDesc = getAllItemLists()

  const filteredItems = itemDesc.filter((item) => item.compendiumEntry)
  const filteredResources = resourceDesc.filter((resource) => resource.compendiumEntry)
  const filteredCargo = cargoDesc.filter((cargo) => !shouldFilterItem(cargo))

  const calculatorItems = transformItemsToCalculator(filteredItems)
  const calculatorCargo = transformCargoToCalculator(filteredCargo)
  const calculatorResources = transformResourcesToCalculator(filteredResources)

  const allCalculatorItems = [...calculatorItems, ...calculatorCargo, ...calculatorResources]

  const unifiedLookup = createUnifiedLookup(
    filteredItems,
    filteredCargo,
    filteredResources,
    mapItemToCalculatorItem,
    mapCargoToCalculatorItem,
    mapResourceToCalculatorItem
  )

  const calculatorCraftingRecipes = transformCraftingRecipesToCalculator(craftingRecipeDesc, itemListDesc, itemDesc)
  const calculatorExtractionRecipes = transformExtractionRecipesToCalculator(extractionRecipeDesc, unifiedLookup)
  const allCalculatorRecipes = [...calculatorCraftingRecipes, ...calculatorExtractionRecipes]

  return {
    items: allCalculatorItems,
    recipes: allCalculatorRecipes
  }
}