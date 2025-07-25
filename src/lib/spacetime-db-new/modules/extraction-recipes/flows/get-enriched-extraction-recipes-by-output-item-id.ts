import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ExtractionRecipeDesc } from '@/data/bindings/extraction_recipe_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import type { SkillDesc } from '@/data/bindings/skill_desc_type'
import { getAllCargo } from '../../cargo/commands/get-all-cargo'
import { getAllItems } from '../../items/commands/get-all-items'
import { getAllResources } from '../../resources/commands/get-all-resources'
import { getSkillById } from '../../skills/commands/get-skill-by-id'
import { getToolByTypeAndLevel } from '../../tools/commands/get-tool-by-type-and-level'
import { getToolTypeById } from '../../tools/commands/get-tool-type-by-id'
import { getExtractionRecipesByOutputItemId } from '../commands/get-extraction-recipes-by-output-item-id'

export interface EnrichedProbabilisticItemStack {
  itemId: number
  quantity: number
  probability: number
  itemType: 'Item' | 'Cargo'
  item?: ItemDesc
  cargo?: CargoDesc
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
  toolTypeName: string
  toolItem: ItemDesc | undefined
}

export interface EnrichedLevelRequirement {
  skillId: number
  level: number
  skill: SkillDesc | undefined
}

export interface EnrichedExtractionRecipe extends ExtractionRecipeDesc {
  enrichedExtractedItems: EnrichedProbabilisticItemStack[]
  enrichedConsumedItems: EnrichedItemStack[]
  enrichedToolRequirements: EnrichedToolRequirement[]
  enrichedLevelRequirements: EnrichedLevelRequirement[]
  resource: ResourceDesc | undefined
}

/**
 * Get enriched extraction recipes that produce a specific item with item, cargo, and resource data resolved
 */
export function getEnrichedExtractionRecipesByOutputItemId(itemId: number): EnrichedExtractionRecipe[] {
  const extractionRecipes = getExtractionRecipesByOutputItemId(itemId)
  const allItems = getAllItems()
  const allCargo = getAllCargo()
  const allResources = getAllResources()
  const itemsMap = new Map(allItems.map((item) => [item.id, item]))
  const cargoMap = new Map(allCargo.map((cargo) => [cargo.id, cargo]))
  const resourcesMap = new Map(allResources.map((resource) => [resource.id, resource]))

  return extractionRecipes.map((recipe) => {
    // Resolve extracted items (probabilistic) - can be either items or cargo
    const enrichedExtractedItems: EnrichedProbabilisticItemStack[] = recipe.extractedItemStacks.map((stack) => {
      const itemId = stack.itemStack?.itemId || 0
      const quantity = stack.itemStack?.quantity || 0
      const itemType = stack.itemStack?.itemType?.tag as 'Item' | 'Cargo'

      return {
        itemId,
        quantity,
        probability: stack.probability,
        itemType,
        item: itemType === 'Item' ? itemsMap.get(itemId) : undefined,
        cargo: itemType === 'Cargo' ? cargoMap.get(itemId) : undefined
      }
    })

    // Resolve consumed items (these are always items, not cargo)
    const enrichedConsumedItems: EnrichedItemStack[] = recipe.consumedItemStacks.map((stack) => ({
      itemId: stack.itemId,
      quantity: stack.quantity,
      item: itemsMap.get(stack.itemId)
    }))

    // Resolve tool requirements
    const enrichedToolRequirements: EnrichedToolRequirement[] = recipe.toolRequirements.map((toolReq) => {
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
    const enrichedLevelRequirements: EnrichedLevelRequirement[] = recipe.levelRequirements.map((levelReq) => {
      const skill = getSkillById(levelReq.skillId)

      return {
        skillId: levelReq.skillId,
        level: levelReq.level,
        skill
      }
    })

    // Resolve resource data
    const resource = resourcesMap.get(recipe.resourceId)

    return {
      ...recipe,
      enrichedExtractedItems,
      enrichedConsumedItems,
      enrichedToolRequirements,
      enrichedLevelRequirements,
      resource
    }
  })
}
