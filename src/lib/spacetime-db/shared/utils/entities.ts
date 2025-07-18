/**
 * Get tier color classes for UI display
 */
export function getTierColor(tier: number): string {
  switch (tier) {
    case 1:
      return 'bg-gray-100 text-gray-800 border-gray-300'
    case 2:
      return 'bg-green-100 text-green-800 border-green-300'
    case 3:
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 4:
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 5:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 6:
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
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