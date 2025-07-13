// Quick test to verify the building categories are working
const fs = require('fs')

// Load the building type data to verify our mapping is correct
const buildingTypeData = JSON.parse(fs.readFileSync('./src/data/region/building_type_desc.json', 'utf8'))
const buildingFunctionMappingData = JSON.parse(
  fs.readFileSync('./src/data/region/building_function_type_mapping_desc.json', 'utf8')
)

// BuildingCategory enum mapping
const BUILDING_CATEGORY_MAPPING = {
  0: 'Storage',
  1: 'Crafting',
  2: 'Residential',
  3: 'TownHall',
  4: 'Wall',
  5: 'TradingPost',
  6: 'Ornamental',
  7: 'AncientRuins',
  8: 'ClaimTotem',
  9: 'TerrraformingBase',
  10: 'Barter',
  11: 'Portal',
  12: 'RentTerminal',
  13: 'Watchtower',
  14: 'EmpireFoundry',
  15: 'Sign',
  16: 'Gate',
  17: 'Bed',
  18: 'Waystone',
  19: 'Bank',
  20: 'Elevator',
  21: 'TownMarket',
  22: 'RecoveryChest',
  23: 'PlayerHousing'
}

console.log('=== Building Category Mapping Test ===\n')

// Create mapping like the function does
const buildingIdToTypeMap = new Map()

for (const mapping of buildingFunctionMappingData) {
  const buildingType = buildingTypeData.find((type) => type.id === mapping.type_id)
  if (buildingType) {
    for (const buildingId of mapping.desc_ids) {
      buildingIdToTypeMap.set(buildingId, buildingType)
    }
  }
}

console.log(`Total building mappings created: ${buildingIdToTypeMap.size}`)

// Test some sample buildings
const sampleBuildingIds = Array.from(buildingIdToTypeMap.keys()).slice(0, 10)

console.log('\nSample building category mappings:')
sampleBuildingIds.forEach((buildingId) => {
  const buildingType = buildingIdToTypeMap.get(buildingId)
  const categoryIndex = buildingType?.category?.[0]
  const category = typeof categoryIndex === 'number' ? BUILDING_CATEGORY_MAPPING[categoryIndex] : 'Uncategorized'
  console.log(`Building ID ${buildingId}: ${buildingType.name} -> ${category}`)
})

// Count buildings by category
const categoryCount = {}
buildingIdToTypeMap.forEach((buildingType, buildingId) => {
  const categoryIndex = buildingType?.category?.[0]
  const category = typeof categoryIndex === 'number' ? BUILDING_CATEGORY_MAPPING[categoryIndex] : 'Uncategorized'
  categoryCount[category] = (categoryCount[category] || 0) + 1
})

console.log('\nBuildings by category:')
Object.entries(categoryCount).forEach(([category, count]) => {
  console.log(`${category}: ${count} buildings`)
})

console.log(`\nTotal categories: ${Object.keys(categoryCount).length}`)
console.log(
  `Should not have "Uncategorized": ${!categoryCount.Uncategorized ? 'PASS' : 'FAIL - ' + categoryCount.Uncategorized + ' uncategorized buildings'}`
)
