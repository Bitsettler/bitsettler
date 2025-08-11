import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { SkillDesc } from '@/data/bindings/skill_desc_type'
import { getAllItemsUnfiltered } from '@/lib/spacetime-db-new/modules/items/commands/get-all-items-unfiltered'
import { getAllResources } from '@/lib/spacetime-db-new/modules/resources/commands/get-all-resources'
import { getAllCargo } from '@/lib/spacetime-db-new/modules/cargo/commands/get-all-cargo'
import { getAllCraftingRecipes } from '@/lib/spacetime-db-new/modules/crafting-recipes/commands/get-all-crafting-recipes'
import { getItemPrefix } from '@/lib/spacetime-db-new/shared/calculator-utils'
import skillDescData from '@/data/sdk-tables/skill_desc.json'
import extractionRecipeData from '@/data/sdk-tables/extraction_recipe_desc.json'
import type { DepItem, DepRecipe } from './types'

// NOW USING PREFIXED STRING IDs LIKE THE CALCULATOR!
let _itemById: Map<string, DepItem> | null = null
let _recipeByOutputId: Map<string, DepRecipe> | null = null
let _skillById: Map<number, string> | null = null
let _itemToSkill: Map<string, string> | null = null

function isValidName(name: string): boolean {
  return name && name !== '{0}' && name !== '{1}' && !name.includes('{')
}

function getSkillById(): Map<number, string> {
  if (_skillById === null) {
    _skillById = new Map()
    const skills = skillDescData as SkillDesc[]
    for (const skill of skills) {
      if (skill.name && skill.name !== 'ANY') {
        _skillById.set(skill.id, skill.name)
      }
    }
  }
  return _skillById
}

export function getItemById(): Map<string, DepItem> {
  if (_itemById === null) {
    _itemById = new Map()
    
    // Use calculator approach: ALL items get prefixed IDs, NO conflicts!
    // Now Hex Coin = "item_1" and Sagi Bird = "cargo_1" can coexist!
    
    // 1. Add items with "item_" prefix
    const items = getAllItemsUnfiltered()
    for (const item of items) {
      const prefixedId = `item_${item.id}`
      _itemById.set(prefixedId, {
        ...item, // Keep all original fields for icon resolution
        id: prefixedId, // Store the prefixed ID
        name: isValidName(item.name) ? item.name : undefined,
        tier: item.tier || undefined
      })
    }
    
    // 2. Add resources with "resource_" prefix
    const resources = getAllResources()
    for (const resource of resources) {
      const prefixedId = `resource_${resource.id}`
      _itemById.set(prefixedId, {
        ...resource, // Keep all original fields for icon resolution
        id: prefixedId, // Store the prefixed ID
        name: isValidName(resource.name) ? resource.name : undefined,
        tier: resource.tier || undefined
      })
    }
    
    // 3. Add cargo with "cargo_" prefix
    const cargo = getAllCargo()
    for (const cargoItem of cargo) {
      const prefixedId = `cargo_${cargoItem.id}`
      _itemById.set(prefixedId, {
        ...cargoItem, // Keep all original fields for icon resolution
        id: prefixedId, // Store the prefixed ID
        name: isValidName(cargoItem.name) ? cargoItem.name : undefined,
        tier: cargoItem.tier || undefined
      })
    }
  }
  
  return _itemById
}

export function getRecipeByOutputId(): Map<string, DepRecipe> {
  if (_recipeByOutputId === null) {
    _recipeByOutputId = new Map()
    _itemToSkill = new Map()
    
    const recipes = getAllCraftingRecipes()
    const skillById = getSkillById()
    
    // First, build extraction-based skill mappings (gathering skills)
    buildExtractionSkillMappings(skillById)
    
    for (const recipe of recipes) {
      // Determine primary skill for this recipe
      let primarySkill: string | undefined
      if (recipe.levelRequirements && recipe.levelRequirements.length > 0) {
        const skillId = recipe.levelRequirements[0].skillId
        primarySkill = skillById.get(skillId)
      }
      
      // Process each crafted item stack (outputs)
      for (const output of recipe.craftedItemStacks) {
        if (output.itemId && output.quantity > 0) {
          // Use calculator's approach to determine prefix
          const outputPrefix = getItemPrefix(output.itemType)
          const outputPrefixedId = `${outputPrefix}${output.itemId}`
          
          const inputs: Array<{ item_id: string; qty: number }> = []
          
          // Process consumed item stacks (inputs)
          for (const input of recipe.consumedItemStacks) {
            if (input.itemId && input.quantity > 0) {
              const inputPrefix = getItemPrefix(input.itemType)
              const inputPrefixedId = `${inputPrefix}${input.itemId}`
              
              inputs.push({
                item_id: inputPrefixedId, // NOW PREFIXED!
                qty: input.quantity
              })
            }
          }
          
          // Only add recipe if it has inputs
          if (inputs.length > 0) {
            _recipeByOutputId.set(outputPrefixedId, {
              crafted_output: {
                item_id: outputPrefixedId, // NOW PREFIXED!
                qty: output.quantity
              },
              inputs
            })
            
            // Map item to skill using prefixed ID (don't overwrite extraction skills)
            if (primarySkill && !_itemToSkill.has(outputPrefixedId)) {
              _itemToSkill.set(outputPrefixedId, primarySkill)
              
              // Debug: Log some skill mappings for Crop Oil
              if (output.itemId === 1120006 || output.itemId === 2120006) {
                console.log(`🔍 Mapped ${outputPrefixedId} (${output.itemId}) to skill: ${primarySkill}`)
              }
            }
          }
        }
      }
    }
  }
  
  return _recipeByOutputId
}

/**
 * Build skill mappings from extraction recipes (gathering skills)
 */
function buildExtractionSkillMappings(skillById: Map<number, string>) {
  for (const extractionRecipe of extractionRecipeData) {
    // Get the skill required for this extraction
    let extractionSkill: string | undefined
    if (extractionRecipe.levelRequirements && extractionRecipe.levelRequirements.length > 0) {
      const skillId = extractionRecipe.levelRequirements[0].skillId
      extractionSkill = skillById.get(skillId)
    }
    
    if (extractionSkill) {
      // Map all extracted items to this skill
      for (const extractedStack of extractionRecipe.extractedItemStacks) {
        const itemStack = extractedStack.itemStack
        if (itemStack.itemId) {
          const itemPrefix = getItemPrefix(itemStack.itemType)
          const itemPrefixedId = `${itemPrefix}${itemStack.itemId}`
          _itemToSkill.set(itemPrefixedId, extractionSkill)
        }
      }
    }
  }
}

export function getItemToSkill(): Map<string, string> {
  // Ensure recipe processing is done (which builds the item-to-skill map)
  getRecipeByOutputId()
  return _itemToSkill || new Map()
}

export function getIndexes() {
  return {
    itemById: getItemById(),
    recipeByOutputId: getRecipeByOutputId(),
    itemToSkill: getItemToSkill()
  }
}

/**
 * Clear all caches - useful for development/debugging
 */
export function clearIndexCaches() {
  _itemById = null
  _recipeByOutputId = null
  _itemToSkill = null
}