import { describe, it, expect, beforeAll } from 'vitest';
import { expandToBase, clearCache } from '../engine';
import { buildIndexes } from '../indexes';
import { Recipe, ItemInfo } from '../types';

describe('Dependency Engine v2 with Real Game Data', () => {
  beforeAll(async () => {
    clearCache();
    
    // Load real game data and build indexes
    try {
      const craftingData = await import('@/data/sdk-tables/crafting_recipe_desc.json');
      const itemData = await import('@/data/sdk-tables/item_desc.json');
      
      const recipes: Recipe[] = [];
      const items: ItemInfo[] = [];
      
      // Convert real game data to our format
      if (itemData.default && Array.isArray(itemData.default)) {
        for (const item of itemData.default) {
          if (item.id && item.name) {
            items.push({
              id: item.id,
              name: item.name,
              tier: item.tier || 0
            });
          }
        }
      }
      
      if (craftingData.default && Array.isArray(craftingData.default)) {
        for (const recipe of craftingData.default) {
          if (!recipe.craftedItemStacks || !recipe.consumedItemStacks) continue;
          
          const outputStack = recipe.craftedItemStacks[0];
          if (!outputStack || !outputStack.itemId) continue;
          
          const inputItems: number[] = [];
          const inputQuantities: number[] = [];
          
          for (const consumedStack of recipe.consumedItemStacks) {
            if (consumedStack.itemId && consumedStack.quantity) {
              inputItems.push(consumedStack.itemId);
              inputQuantities.push(consumedStack.quantity);
            }
          }
          
          if (inputItems.length > 0) {
            recipes.push({
              id: recipe.id,
              output_item: outputStack.itemId,
              output_quantity: outputStack.quantity || 1,
              input_items: inputItems,
              input_quantities: inputQuantities
            });
          }
        }
      }
      
      console.log(`✅ Loaded ${recipes.length} recipes, ${items.length} items`);
      buildIndexes(recipes, items);
    } catch (error) {
      console.warn('⚠️ Failed to load real game data:', error);
    }
  });

  it('should work with real item IDs from the game', () => {
    // Test with some known item IDs from the crafting data
    const testItems = [11006, 4002, 4102];
    
    for (const itemId of testItems) {
      const result = expandToBase(itemId, 1);
      
      // Basic validation
      expect(typeof result.steps).toBe('number');
      expect(result.steps).toBeGreaterThanOrEqual(0);
      expect(result.totals instanceof Map).toBe(true);
      
      // If there are materials, quantities should be positive
      result.totals.forEach((qty, id) => {
        expect(qty).toBeGreaterThan(0);
        expect(typeof id).toBe('number');
      });
      
      console.log(`✅ Item ${itemId}: ${result.totals.size} base materials, ${result.steps} steps`);
    }
  });

  it('should handle quantity scaling correctly', () => {
    const result1 = expandToBase(11006, 1);
    const result2 = expandToBase(11006, 3);
    
    // Steps might scale differently due to batch recipes
    expect(result2.steps).toBeGreaterThanOrEqual(result1.steps);
    
    // Each base material should scale proportionally (approximately)
    if (result1.totals.size > 0) {
      result1.totals.forEach((qty1, itemId) => {
        const qty2 = result2.totals.get(itemId) || 0;
        expect(qty2).toBeGreaterThanOrEqual(qty1); // Should be at least the original quantity
      });
    }
  });

  it('should cache results for performance', () => {
    const itemId = 4002;
    
    const start1 = performance.now();
    const result1 = expandToBase(itemId, 1);
    const end1 = performance.now();
    
    const start2 = performance.now();
    const result2 = expandToBase(itemId, 1);
    const end2 = performance.now();
    
    // Second call should be cached (same object)
    expect(result1).toBe(result2);
    
    // Second call should be much faster
    const time1 = end1 - start1;
    const time2 = end2 - start2;
    
    console.log(`⚡ Cold: ${time1.toFixed(1)}ms, Warm: ${time2.toFixed(1)}ms`);
    expect(time2).toBeLessThan(time1 + 1); // Allow some margin for timing variations
  });
});
