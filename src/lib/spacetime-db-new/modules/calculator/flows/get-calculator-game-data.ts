import { mapCargoToCalculatorItem, transformCargoToCalculator } from '../../cargo/commands/map-cargo-to-calculator'
import { getAllCargo } from '../../cargo/commands/get-all-cargo'
import { getAllCraftingRecipes } from '../../crafting-recipes/commands/get-all-crafting-recipes'
import { getAllExtractionRecipes } from '../../extraction-recipes/commands/get-all-extraction-recipes'
import { getAllItemLists } from '../../item-lists/commands/get-all-item-lists'
import { mapItemToCalculatorItem, transformItemsToCalculator } from '../../items/commands/map-item-to-calculator'
import { getAllItems } from '../../items/commands/get-all-items'
import { getAllItemsUnfiltered } from '../../items/commands/get-all-items-unfiltered'
import {
  transformCraftingRecipesToCalculator,
  transformExtractionRecipesToCalculator
} from '../../recipes/calculator'
import {
  mapResourceToCalculatorItem,
  transformResourcesToCalculator
} from '../../resources/commands/map-resource-to-calculator'
import { getAllResources } from '../../resources/commands/get-all-resources'
import { createUnifiedLookup, shouldFilterItem } from '../../../shared/calculator-utils'
import type { CalculatorGameData } from '../../../shared/dtos/calculator-dtos'

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
  
  // Get unfiltered items for recipe resolution
  const allItemsUnfiltered = getAllItemsUnfiltered()

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

  const calculatorCraftingRecipes = transformCraftingRecipesToCalculator(craftingRecipeDesc, itemListDesc, allItemsUnfiltered)
  const calculatorExtractionRecipes = transformExtractionRecipesToCalculator(extractionRecipeDesc, unifiedLookup)
  const allCalculatorRecipes = [...calculatorCraftingRecipes, ...calculatorExtractionRecipes]

  return {
    items: allCalculatorItems,
    recipes: allCalculatorRecipes
  }
}