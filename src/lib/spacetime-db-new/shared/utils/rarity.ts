// Rarity order from lowest to highest
export const RARITY_ORDER = [
  'Default',
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic'
] as const
export type RarityTag = (typeof RARITY_ORDER)[number]

/**
 * Get rarity color classes for UI display
 */
export function getRarityColor(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common':
    case 'default':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    case 'uncommon':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'rare':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'epic':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'legendary':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'mythic':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

/**
 * Get the lowest available rarity from a group of items
 */
export function getLowestRarity<
  T extends { item: { rarity: { tag: string } } }
>(items: T[]): string {
  if (items.length === 0) return 'Common'

  const availableRarities = [
    ...new Set(items.map((item) => item.item.rarity.tag))
  ]

  // Find the lowest rarity based on RARITY_ORDER
  for (const rarity of RARITY_ORDER) {
    if (availableRarities.includes(rarity)) {
      return rarity
    }
  }

  // Fallback to the first available rarity if none match our order
  return availableRarities[0]
}
