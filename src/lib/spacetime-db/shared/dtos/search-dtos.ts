/**
 * Data Transfer Objects for search functionality
 */

export interface SearchItem {
  id: string
  name: string
  slug: string
  category: string
  type: 'item' | 'cargo' | 'resource' | 'collection'
  href: string
  tier?: number
  rarity?: string
  tag?: string
  description?: string
  icon_asset_name?: string
  section?: string
}

export interface SearchData {
  items: SearchItem[]
}

/**
 * Transform search data to unified format
 */
export function transformToSearchData(
  items: SearchItem[],
  cargo: SearchItem[],
  resources: SearchItem[],
  collections: SearchItem[]
): SearchData {
  return {
    items: [...items, ...cargo, ...resources, ...collections]
  }
}