/**
 * Get cargo category based on tag
 */
export function getCargoCategory(tag: string): string {
  const categoryMapping: Record<string, string> = {
    Animal: 'Creatures & Wildlife',
    Monster: 'Creatures & Wildlife',
    'Ocean Fish': 'Creatures & Wildlife',
    Timber: 'Raw Materials',
    Chunk: 'Raw Materials',
    'Ore Chunk': 'Raw Materials',
    Geode: 'Raw Materials',
    Roots: 'Raw Materials',
    'Brick Slab': 'Processed Materials',
    Frame: 'Processed Materials',
    Sheeting: 'Processed Materials',
    Tarp: 'Processed Materials',
    Trunk: 'Processed Materials',
    Vehicle: 'Vehicles & Transport',
    Boat: 'Vehicles & Transport',
    Package: 'Trade & Commerce',
    'Brico Goods': 'Trade & Commerce',
    'Traveler Goods': 'Trade & Commerce',
    Supplies: 'Trade & Commerce',
    'Hex Coin Sack': 'Currency & Value',
    'Hexite Capsule': 'Currency & Value',
    Energy: 'Special Items'
  }

  return categoryMapping[tag] || 'Other Cargo'
}