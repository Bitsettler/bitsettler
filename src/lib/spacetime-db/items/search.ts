import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { createSlug } from '../entities'
import { convertRarityToString } from '../rarity'
import { getServerIconPath, cleanIconAssetName } from '../assets'
import type { SearchItem } from '../search-dtos'
import { tagCollections } from '../item-tag-collections'

/**
 * Get compendium href for an item based on its tag
 */
function getItemCompendiumHref(item: { tag?: string }): string {
  if (!item.tag) return '/compendium'
  
  const tagSlug = item.tag.toLowerCase().replace(/\s+/g, '-')
  
  // Check if this item belongs to a specific collection based on its tag
  for (const collection of Object.values(tagCollections)) {
    if (collection.tags.some(tag => tag === item.tag)) {
      // Find the specific category href for this tag
      const category = collection.categories[item.tag as keyof typeof collection.categories]
      if (category) {
        return category.href
      }
    }
  }
  
  // Default fallback to tag page
  return `/compendium/${tagSlug}`
}

/**
 * Map ItemDesc to SearchItem
 */
export function mapItemToSearchItem(item: ItemDesc): SearchItem {
  return {
    id: `item_${item.id}`,
    name: item.name,
    slug: createSlug(item.name),
    category: 'Items',
    type: 'item',
    href: getItemCompendiumHref({ tag: item.tag }),
    tier: item.tier,
    rarity: convertRarityToString(item.rarity),
    tag: item.tag,
    description: item.description,
    icon_asset_name: getServerIconPath(cleanIconAssetName(item.iconAssetName || ''))
  }
}

/**
 * Transform items to search format
 */
export function transformItemsToSearch(items: ItemDesc[]): SearchItem[] {
  return items.map(mapItemToSearchItem)
}