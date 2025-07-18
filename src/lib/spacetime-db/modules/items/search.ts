import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { tagCollections, type TagCategory } from '../collections/item-tag-collections'
import { cleanIconAssetName, getServerIconPath } from '../../shared/assets'
import type { SearchItem } from '../../shared/dtos/search-dtos'
import { createSlug } from '../../shared/utils/entities'
import { convertRarityToString } from '../../shared/utils/rarity'

/**
 * Get compendium href for an item based on its tag
 */
function getItemCompendiumHref(item: { tag?: string }): string {
  if (!item.tag) return '/compendium'

  const tagSlug = item.tag.toLowerCase().replace(/\s+/g, '-')

  // Check if this item belongs to a specific collection based on its tag
  for (const collection of Object.values(tagCollections)) {
    if (collection.tags.some((tag) => tag === item.tag)) {
      // Find the specific category href for this tag
      const categories = collection.categories as Record<string, TagCategory>
      const category = categories[item.tag]
      if (category && category.href) {
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
