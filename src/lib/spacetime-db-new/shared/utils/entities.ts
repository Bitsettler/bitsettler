/**
 * Get tier color classes for UI display (supports tiers 0-10)
 */
export function getTierColor(tier: number): string {
  switch (tier) {
    case 0:
      return 'bg-slate-700 text-slate-50 border-slate-500'
    case 1:
      return 'bg-stone-700 text-stone-100 border-stone-500'
    case 2:
      return 'bg-yellow-700 text-yellow-100 border-yellow-500'
    case 3:
      return 'bg-lime-300 text-lime-950 border-lime-800'
    case 4:
      return 'bg-sky-300 text-sky-950 border-sky-800'
    case 5:
      return 'bg-indigo-300 text-indigo-950 border-indigo-800'
    case 6:
      return 'bg-red-300 text-red-950 border-red-800'
    case 7:
      return 'bg-yellow-300 text-yellow-950 border-yellow-800'
    case 8:
      return 'bg-cyan-200 text-cyan-950 border-cyan-800'
    case 9:
      return 'bg-zinc-900 text-zinc-300 border-zinc-500'
    case 10:
      return 'bg-stone-300 text-stone-950 border-stone-800'
    default:
      return 'bg-slate-700 text-slate-50 border-slate-500'
  }
}

/**
 * Create a slug from a name (kebab-case)
 * Example: "Raw Meal" -> "raw-meal"
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Convert slug back to title case
 * Example: "raw-meal" -> "Raw Meal"
 */
export function slugToTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
