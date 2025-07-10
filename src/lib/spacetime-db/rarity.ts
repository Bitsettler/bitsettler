import type { Rarity } from '@/data/bindings/rarity_type'

/**
 * Convert server rarity tagged union to string
 */
export function convertRarityToString(rarity: Rarity): string {
  if ('tag' in rarity) {
    switch (rarity.tag) {
      case 'Default':
      case 'Common':
        return 'common'
      case 'Uncommon':
        return 'uncommon'
      case 'Rare':
        return 'rare'
      case 'Epic':
        return 'epic'
      case 'Legendary':
        return 'legendary'
      case 'Mythic':
        return 'mythic'
      default:
        return 'common'
    }
  }
  return 'common'
}

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
 * Get rarity display name
 */
export function getRarityDisplayName(rarity: string): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase()
}

/**
 * Convert rarity array format [number, {}] to string
 */
export function convertRarityArrayToString(rarityArray: [number, Record<string, unknown>]): string {
  const [rarityIndex] = rarityArray
  switch (rarityIndex) {
    case 0:
      return 'default'
    case 1:
      return 'common'
    case 2:
      return 'uncommon'
    case 3:
      return 'rare'
    case 4:
      return 'epic'
    case 5:
      return 'legendary'
    case 6:
      return 'mythic'
    default:
      return 'common'
  }
}
