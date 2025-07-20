import { getAllItems } from './get-all-items'

/**
 * Get all unique item tags from SDK data
 */
export function getAllItemTags(): string[] {
  const items = getAllItems()
  const tagSet = new Set<string>()
  
  items.forEach(item => {
    if (item.tag) {
      tagSet.add(item.tag)
    }
  })
  
  return Array.from(tagSet).sort()
}

/**
 * Check if a tag exists in the item data
 */
export function isValidItemTag(tag: string): boolean {
  const items = getAllItems()
  return items.some(item => item.tag === tag)
}