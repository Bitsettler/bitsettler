import type { BuildingTypeDesc } from '@/data/bindings/building_type_desc_type'
import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { SkillDesc } from '@/data/bindings/skill_desc_type'
import { resolveRecipeName } from '../../../shared/calculator-utils'
import { getBuildingTypeById } from '../../buildings/commands/get-building-type-by-id'
import { getAllItems } from '../../items/commands/get-all-items'
import { getSkillById } from '../../skills/commands/get-skill-by-id'
import { getToolByTypeAndLevel } from '../../tools/commands/get-tool-by-type-and-level'
import { getToolTypeById } from '../../tools/commands/get-tool-type-by-id'
import { getCraftingRecipesByOutputItemId } from '../commands/get-crafting-recipes-by-output-item-id'

export interface EnrichedItemStack {
  itemId: number
  quantity: number
  item: ItemDesc | undefined
}

export interface EnrichedToolRequirement {
  toolType: number
  level: number
  power: number
  toolTypeName: string
  toolItem: ItemDesc | undefined
}

export interface EnrichedLevelRequirement {
  skillId: number
  level: number
  skill: SkillDesc | undefined
}

export interface EnrichedCraftingRecipe extends CraftingRecipeDesc {
  enrichedConsumedItems: EnrichedItemStack[]
  enrichedCraftedItems: EnrichedItemStack[]
  enrichedToolRequirements: EnrichedToolRequirement[]
  enrichedLevelRequirements: EnrichedLevelRequirement[]
  resolvedBuildingType: BuildingTypeDesc | undefined
  resolvedRecipeName: string
}

/**
 * Get enriched crafting recipes that produce a specific item with item data resolved
 */
export function getEnrichedCraftingRecipesByOutputItemId(
  itemId: number
): EnrichedCraftingRecipe[] {
  const craftingRecipes = getCraftingRecipesByOutputItemId(itemId)
  const allItems = getAllItems()
  const itemsMap = new Map(allItems.map((item) => [item.id, item]))

  return craftingRecipes.map((recipe) => {
    // Resolve consumed items
    const enrichedConsumedItems: EnrichedItemStack[] =
      recipe.consumedItemStacks.map((stack) => ({
        itemId: stack.itemId,
        quantity: stack.quantity,
        item: itemsMap.get(stack.itemId)
      }))

    // Resolve crafted items
    const enrichedCraftedItems: EnrichedItemStack[] =
      recipe.craftedItemStacks.map((stack) => ({
        itemId: stack.itemId,
        quantity: stack.quantity,
        item: itemsMap.get(stack.itemId)
      }))

    // Resolve tool requirements
    const enrichedToolRequirements: EnrichedToolRequirement[] =
      recipe.toolRequirements.map((toolReq) => {
        const toolType = getToolTypeById(toolReq.toolType)
        const toolItem = getToolByTypeAndLevel(toolReq.toolType, toolReq.level)

        return {
          toolType: toolReq.toolType,
          level: toolReq.level,
          power: toolReq.power,
          toolTypeName: toolType?.name || `Tool Type ${toolReq.toolType}`,
          toolItem
        }
      })

    // Resolve level requirements
    const enrichedLevelRequirements: EnrichedLevelRequirement[] =
      recipe.levelRequirements.map((levelReq) => {
        const skill = getSkillById(levelReq.skillId)

        return {
          skillId: levelReq.skillId,
          level: levelReq.level,
          skill
        }
      })

    // Resolve building requirement
    const resolvedBuildingType = recipe.buildingRequirement
      ? getBuildingTypeById(recipe.buildingRequirement.buildingType)
      : undefined

    // Resolve recipe name
    const resolvedRecipeName = resolveRecipeName(
      recipe.name,
      enrichedCraftedItems,
      enrichedConsumedItems
    )

    return {
      ...recipe,
      enrichedConsumedItems,
      enrichedCraftedItems,
      enrichedToolRequirements,
      enrichedLevelRequirements,
      resolvedBuildingType,
      resolvedRecipeName
    }
  })
}
