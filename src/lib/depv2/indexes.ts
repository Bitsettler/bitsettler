import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { CraftingRecipeDesc } from '@/data/bindings/crafting_recipe_desc_type'
import type { SkillDesc } from '@/data/bindings/skill_desc_type'
import { getAllItemsUnfiltered } from '@/lib/spacetime-db-new/modules/items/commands/get-all-items-unfiltered'
import { getAllResources } from '@/lib/spacetime-db-new/modules/resources/commands/get-all-resources'
import { getAllCargo } from '@/lib/spacetime-db-new/modules/cargo/commands/get-all-cargo'
import { getAllCraftingRecipes } from '@/lib/spacetime-db-new/modules/crafting-recipes/commands/get-all-crafting-recipes'
import skillDescData from '@/data/sdk-tables/skill_desc.json'
import type { DepItem, DepRecipe } from './types'

let _itemById: Map<number, DepItem> | null = null
let _recipeByOutputId: Map<number, DepRecipe> | null = null
let _skillById: Map<number, string> | null = null
let _itemToSkill: Map<number, string> | null = null

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

export function getItemById(): Map<number, DepItem> {
  if (_itemById === null) {
    _itemById = new Map()
    
    // Add items (unfiltered to match calculator behavior and include all recipe ingredients)
    const items = getAllItemsUnfiltered()
    for (const item of items) {
      _itemById.set(item.id, {
        id: item.id,
        name: isValidName(item.name) ? item.name : undefined,
        tier: item.tier || undefined
      })
    }
    
    // Add resources
    const resources = getAllResources()
    for (const resource of resources) {
      _itemById.set(resource.id, {
        id: resource.id,
        name: isValidName(resource.name) ? resource.name : undefined,
        tier: resource.tier || undefined
      })
    }
    
    // Add cargo
    const cargo = getAllCargo()
    for (const cargoItem of cargo) {
      _itemById.set(cargoItem.id, {
        id: cargoItem.id,
        name: isValidName(cargoItem.name) ? cargoItem.name : undefined,
        tier: cargoItem.tier || undefined
      })
    }
  }
  
  return _itemById
}

export function getRecipeByOutputId(): Map<number, DepRecipe> {
  if (_recipeByOutputId === null) {
    _recipeByOutputId = new Map()
    _itemToSkill = new Map()
    
    const recipes = getAllCraftingRecipes()
    const skillById = getSkillById()
    
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
          const inputs: Array<{ item_id: number; qty: number }> = []
          
          // Process consumed item stacks (inputs)
          for (const input of recipe.consumedItemStacks) {
            if (input.itemId && input.quantity > 0) {
              inputs.push({
                item_id: input.itemId,
                qty: input.quantity
              })
            }
          }
          
          // Only add recipe if it has inputs
          if (inputs.length > 0) {
            _recipeByOutputId.set(output.itemId, {
              crafted_output: {
                item_id: output.itemId,
                qty: output.quantity
              },
              inputs
            })
            
            // Map item to skill
            if (primarySkill) {
              _itemToSkill.set(output.itemId, primarySkill)
            }
          }
        }
      }
    }
  }
  
  return _recipeByOutputId
}

export function getItemToSkill(): Map<number, string> {
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
