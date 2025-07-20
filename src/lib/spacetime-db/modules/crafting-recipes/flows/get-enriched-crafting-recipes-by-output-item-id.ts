import type { BuildingTypeDesc } from '@/data/bindings/building_type_desc_type'
import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { KnowledgeScrollDesc } from '@/data/bindings/knowledge_scroll_desc_type'
import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import { getBuildingTypeById } from '../../buildings/commands/get-building-type-by-id'
import { getAllItems } from '../../items/commands/get-all-items'
import { getKnowledgeScrollById } from '../../knowledge/commands/get-knowledge-scroll-by-id'
import { getProfessionById } from '../../professions/professions'
import { getToolByType } from '../../tools/commands/get-tools-by-type'
import { searchCraftingRecipes } from '../commands/search-crafting-recipes'

export interface EnrichedItemStack {
  itemId: number
  quantity: number
  item: ItemDesc | undefined
}

export interface EnrichedToolRequirement {
  toolType: number
  level: number
  power: number
  tool: ToolDesc | undefined
}

export interface EnrichedLevelRequirement {
  skillId: number
  level: number
  profession: ReturnType<typeof getProfessionById>
}

export interface EnrichedCraftingRecipe extends CraftingRecipeDesc {
  resolvedBuildingType: BuildingTypeDesc | undefined
  enrichedConsumedItems: EnrichedItemStack[]
  enrichedCraftedItems: EnrichedItemStack[]
  enrichedToolRequirements: EnrichedToolRequirement[]
  enrichedLevelRequirements: EnrichedLevelRequirement[]
  enrichedRequiredKnowledge: (KnowledgeScrollDesc | undefined)[]
  enrichedBlockingKnowledge: (KnowledgeScrollDesc | undefined)[]
}

/**
 * Get enriched crafting recipes that produce a specific item with all related data resolved
 */
export function getEnrichedCraftingRecipesByOutputItemId(itemId: number): EnrichedCraftingRecipe[] {
  const craftingRecipes = searchCraftingRecipes([{ outputItemId: itemId }])
  const allItems = getAllItems()
  const itemsMap = new Map(allItems.map((item) => [item.id, item]))

  return craftingRecipes.map((recipe) => {
    // Resolve building type
    const resolvedBuildingType = recipe.buildingRequirement
      ? getBuildingTypeById(recipe.buildingRequirement.buildingType)
      : undefined

    // Resolve consumed items
    const enrichedConsumedItems: EnrichedItemStack[] = recipe.consumedItemStacks.map((stack) => ({
      itemId: stack.itemId,
      quantity: stack.quantity,
      item: itemsMap.get(stack.itemId)
    }))

    // Resolve crafted items
    const enrichedCraftedItems: EnrichedItemStack[] = recipe.craftedItemStacks.map((stack) => ({
      itemId: stack.itemId,
      quantity: stack.quantity,
      item: itemsMap.get(stack.itemId)
    }))

    // Resolve tool requirements
    const enrichedToolRequirements: EnrichedToolRequirement[] = recipe.toolRequirements.map((toolReq) => ({
      toolType: toolReq.toolType,
      level: toolReq.level,
      power: toolReq.power,
      tool: getToolByType(toolReq.toolType)
    }))

    // Resolve level requirements
    const enrichedLevelRequirements: EnrichedLevelRequirement[] = recipe.levelRequirements.map((levelReq) => ({
      skillId: levelReq.skillId,
      level: levelReq.level,
      profession: getProfessionById(levelReq.skillId)
    }))

    // Resolve knowledge requirements
    const enrichedRequiredKnowledge = recipe.requiredKnowledges.map((knowledgeId) =>
      getKnowledgeScrollById(knowledgeId)
    )

    // Resolve blocking knowledge
    const enrichedBlockingKnowledge = recipe.blockingKnowledges.map((knowledgeId) =>
      getKnowledgeScrollById(knowledgeId)
    )

    return {
      ...recipe,
      resolvedBuildingType,
      enrichedConsumedItems,
      enrichedCraftedItems,
      enrichedToolRequirements,
      enrichedLevelRequirements,
      enrichedRequiredKnowledge,
      enrichedBlockingKnowledge
    }
  })
}
