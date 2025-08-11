// Manual test scenarios for the dependency engine
// Use these test cases on the /dev/depv2 page to validate functionality

export const manualTestCases = [
  {
    name: "Base material (no recipe)",
    description: "Items without recipes should be treated as base materials",
    instructions: "Try any item ID that doesn't have a recipe (e.g., basic resources)"
  },
  
  {
    name: "Simple one-hop recipe", 
    description: "Basic crafting with single ingredient type",
    instructions: "Find a simple crafted item that requires only one type of base material"
  },
  
  {
    name: "Multi-level recipe with shared ingredients",
    description: "Complex items that require crafted components with overlapping base materials",
    instructions: "Find a complex item (like tools or advanced materials) that uses multiple crafted components"
  },
  
  {
    name: "Recipe with output qty > 1",
    description: "Recipes that produce multiple items per craft should use ceiling division",
    instructions: "Find a recipe that outputs multiple items, test with quantities that don't divide evenly"
  },
  
  {
    name: "Missing recipe handling",
    description: "Unknown item IDs should be handled gracefully",
    instructions: "Try item ID 999999 or another very high number that doesn't exist"
  },
  
  {
    name: "Memoization check",
    description: "Repeated calls with same parameters should return quickly",
    instructions: "Call the same item/qty combination multiple times and observe performance"
  }
]

// Expected behaviors to validate manually:
export const expectedBehaviors = {
  baseItems: "Items without recipes show 0 crafting steps and only themselves in materials",
  craftedItems: "Items with recipes show >0 steps and only base materials (no intermediate items)",
  sharedIngredients: "When multiple sub-recipes use the same base material, quantities are aggregated",
  outputQuantity: "When recipe outputs multiple items, crafting count uses Math.ceil(needed/output)",
  unknownItems: "Unknown item IDs are treated as base materials",
  cycleDetection: "Circular recipe dependencies don't cause infinite loops",
  caching: "Identical calls return the same result quickly (memoization working)"
}