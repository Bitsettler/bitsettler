/**
 * Check if cargo is animal-related
 */
export function isAnimalType(tag: string): boolean {
  const animalTags = ['Animal', 'Monster', 'Ocean Fish']
  return animalTags.includes(tag)
}

/**
 * Check if cargo is material-related
 */
export function isMaterialType(tag: string): boolean {
  const materialTags = [
    'Timber',
    'Chunk',
    'Ore Chunk',
    'Geode',
    'Roots',
    'Brick Slab',
    'Frame',
    'Sheeting',
    'Tarp',
    'Trunk'
  ]
  return materialTags.includes(tag)
}

/**
 * Check if cargo is vehicle-related
 */
export function isVehicleType(tag: string): boolean {
  const vehicleTags = ['Vehicle', 'Boat']
  return vehicleTags.includes(tag)
}

/**
 * Check if cargo is package-related
 */
export function isPackageType(tag: string): boolean {
  return tag === 'Package'
}

/**
 * Check if cargo is trading goods
 */
export function isTradingGoodsType(tag: string): boolean {
  const tradingTags = ['Brico Goods', 'Traveler Goods', 'Supplies']
  return tradingTags.includes(tag)
}
