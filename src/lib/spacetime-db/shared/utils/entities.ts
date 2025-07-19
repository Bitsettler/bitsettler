/**
 * Get tier color classes for UI display (supports tiers 1-10)
 */
export function getTierColor(tier: number): string {
  switch (tier) {
    case 1:
      return 'bg-slate-100 text-slate-800 border-slate-300' // Basic - slate
    case 2:
      return 'bg-green-100 text-green-800 border-green-300' // Common - green
    case 3:
      return 'bg-blue-100 text-blue-800 border-blue-300' // Uncommon - blue
    case 4:
      return 'bg-purple-100 text-purple-800 border-purple-300' // Rare - purple
    case 5:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300' // Epic - yellow/gold
    case 6:
      return 'bg-orange-100 text-orange-800 border-orange-300' // Legendary - orange
    case 7:
      return 'bg-red-100 text-red-800 border-red-300' // Mythic - red
    case 8:
      return 'bg-pink-100 text-pink-800 border-pink-300' // Celestial - pink
    case 9:
      return 'bg-indigo-100 text-indigo-800 border-indigo-300' // Divine - indigo
    case 10:
      return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300' // Transcendent - gradient
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300' // Default to basic tier
  }
}

/**
 * Create a slug from a name
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
