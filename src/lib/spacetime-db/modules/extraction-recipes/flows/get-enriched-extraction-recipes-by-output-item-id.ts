import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { KnowledgeScrollDesc } from '@/data/bindings/knowledge_scroll_desc_type'
import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import { getAllItems } from '../../items/commands/get-all-items'
import { getKnowledgeScrollById } from '../../knowledge/commands/get-knowledge-scroll-by-id'
import { getProfessionById } from '../../professions/professions'
import { getAllResources } from '../../resources/commands/get-all-resources'
import { getToolByType } from '../../tools/commands/get-tools-by-type'
import { searchExtractionRecipes } from '../commands/search-extraction-recipes'

export interface EnrichedProbabilisticItemStack {
  itemId: number
  quantity: number
  probability: number
  item: ItemDesc | undefined
}

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

export interface EnrichedExtractionRecipe extends ExtractionRecipeDesc {
  recipeName: string
  enrichedExtractedItems: EnrichedProbabilisticItemStack[]
  enrichedConsumedItems: EnrichedItemStack[]
  enrichedToolRequirements: EnrichedToolRequirement[]
  enrichedLevelRequirements: EnrichedLevelRequirement[]
  enrichedRequiredKnowledge: (KnowledgeScrollDesc | undefined)[]
}

/**
 * Get enriched extraction recipes that produce a specific item with all related data resolved
 */
export function getEnrichedExtractionRecipesByOutputItemId(itemId: number): EnrichedExtractionRecipe[] {
  const extractionRecipes = searchExtractionRecipes([{ outputItemId: itemId }])
  const allItems = getAllItems()
  const itemsMap = new Map(allItems.map((item) => [item.id, item]))
  const allResources = getAllResources()
  const resourcesMap = new Map(allResources.map((resource) => [resource.id, resource]))

  return extractionRecipes.map((recipe) => {
    // Generate recipe name from verbPhrase and resource
    const resource = resourcesMap.get(recipe.resourceId)
    const recipeName =
      recipe.verbPhrase && resource
        ? `${recipe.verbPhrase} ${resource.name}`
        : `Extract from Resource ${recipe.resourceId}`

    // Resolve extracted items (probabilistic) - these are arrays: [[unknown, [itemId, quantity, [itemType, []], [durability, []]]], probability]
    const enrichedExtractedItems: EnrichedProbabilisticItemStack[] = recipe.extractedItemStacks.map((stackEntry) => {
      if (Array.isArray(stackEntry) && stackEntry.length >= 2) {
        const [itemStack, probability] = stackEntry
        if (Array.isArray(itemStack) && itemStack.length >= 2) {
          const [, itemDetails] = itemStack
          if (Array.isArray(itemDetails) && itemDetails.length >= 2) {
            const [itemId, quantity] = itemDetails
            return {
              itemId: typeof itemId === 'number' ? itemId : 0,
              quantity: typeof quantity === 'number' ? quantity : 0,
              probability: typeof probability === 'number' ? probability : 0,
              item: itemsMap.get(itemId)
            }
          }
        }
      }
      return {
        itemId: 0,
        quantity: 0,
        probability: 0,
        item: undefined
      }
    })

    // Resolve consumed items - these are InputItemStack objects
    const enrichedConsumedItems: EnrichedItemStack[] = recipe.consumedItemStacks.map((stack) => ({
      itemId: stack.itemId,
      quantity: stack.quantity,
      item: itemsMap.get(stack.itemId)
    }))

    // Resolve tool requirements - now properly transformed to ToolRequirement objects
    const enrichedToolRequirements: EnrichedToolRequirement[] = recipe.toolRequirements.map((toolReq) => ({
      toolType: toolReq.toolType,
      level: toolReq.level,
      power: toolReq.power,
      tool: getToolByType(toolReq.toolType)
    }))

    // Resolve level requirements - now properly transformed to LevelRequirement objects
    const enrichedLevelRequirements: EnrichedLevelRequirement[] = recipe.levelRequirements.map((levelReq) => ({
      skillId: levelReq.skillId,
      level: levelReq.level,
      profession: getProfessionById(levelReq.skillId)
    }))

    // Resolve knowledge requirements
    const enrichedRequiredKnowledge = recipe.requiredKnowledges.map((knowledgeId) =>
      getKnowledgeScrollById(knowledgeId)
    )

    return {
      ...recipe,
      recipeName,
      enrichedExtractedItems,
      enrichedConsumedItems,
      enrichedToolRequirements,
      enrichedLevelRequirements,
      enrichedRequiredKnowledge
    }
  })
}
