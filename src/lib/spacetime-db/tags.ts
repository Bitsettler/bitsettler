import type { CompendiumEntity } from './types'

/**
 * Extract unique categories from entities
 */
export function extractUniqueCategories(entities: CompendiumEntity[]): string[] {
  const categories = new Set<string>()
  entities.forEach((entity) => {
    if (entity.tag && entity.tag.trim()) {
      categories.add(entity.tag)
    }
  })
  return Array.from(categories).sort()
}

/**
 * Get category color classes for UI display
 */
export function getCategoryColor(category: string): string {
  // Use a simple hash to generate consistent colors
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }

  const colors = [
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-green-100 text-green-800 border-green-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-orange-100 text-orange-800 border-orange-300',
    'bg-pink-100 text-pink-800 border-pink-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
    'bg-cyan-100 text-cyan-800 border-cyan-300',
    'bg-teal-100 text-teal-800 border-teal-300'
  ]

  return colors[Math.abs(hash) % colors.length]
}

/**
 * Normalize category name for display
 */
export function normalizeCategoryName(category: string): string {
  return category
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Group entities by category
 */
export function groupEntitiesByCategory(entities: CompendiumEntity[]): Record<string, CompendiumEntity[]> {
  const groups: Record<string, CompendiumEntity[]> = {}

  entities.forEach((entity) => {
    const category = entity.tag || 'Uncategorized'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(entity)
  })

  return groups
}

/**
 * Get category statistics
 */
export function getCategoryStats(entities: CompendiumEntity[]): Array<{
  category: string
  count: number
  percentage: number
}> {
  const groups = groupEntitiesByCategory(entities)
  const total = entities.length

  return Object.entries(groups)
    .map(([category, items]) => ({
      category,
      count: items.length,
      percentage: Math.round((items.length / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
}
