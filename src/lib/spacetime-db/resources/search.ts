import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { createSlug } from '../entities'
import { convertRarityToString } from '../rarity'
import { getServerIconPath, cleanIconAssetName } from '../assets'
import type { SearchItem } from '../search-dtos'
import { resourceCollections } from './resource-tag-collections'

/**
 * Get compendium href for a resource based on its tag
 */
function getResourceCompendiumHref(resource: { tag?: string }): string {
  if (!resource.tag) return '/compendium/resources'
  
  // Check resource collections
  for (const collection of Object.values(resourceCollections)) {
    if (collection.tags.some(tag => tag === resource.tag)) {
      // Find the specific category href for this tag
      const category = collection.categories[resource.tag as keyof typeof collection.categories]
      if (category) {
        return category.href
      }
    }
  }
  
  // Fallback to resources collection root
  return '/compendium/resources'
}

/**
 * Map ResourceDesc to SearchItem
 */
export function mapResourceToSearchItem(resource: ResourceDesc): SearchItem {
  return {
    id: `resource_${resource.id}`,
    name: resource.name,
    slug: createSlug(resource.name),
    category: 'Resources',
    type: 'resource',
    href: getResourceCompendiumHref({ tag: resource.tag }),
    tier: resource.tier,
    rarity: convertRarityToString(resource.rarity),
    tag: resource.tag,
    description: resource.description,
    icon_asset_name: getServerIconPath(cleanIconAssetName(resource.iconAssetName || ''))
  }
}

/**
 * Transform resources to search format
 */
export function transformResourcesToSearch(resources: ResourceDesc[]): SearchItem[] {
  return resources.map(mapResourceToSearchItem)
}