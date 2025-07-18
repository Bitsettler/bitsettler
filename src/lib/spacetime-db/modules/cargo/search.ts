import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import { cleanIconAssetName, getServerIconPath } from '../../shared/assets'
import type { SearchItem } from '../../shared/dtos/search-dtos'
import { createSlug } from '../../shared/utils/entities'
import { convertRarityToString } from '../../shared/utils/rarity'
import { cargoCollections } from '../collections/cargo-tag-collections'

/**
 * Get compendium href for a cargo item based on its tag
 */
function getCargoCompendiumHref(cargo: { tag?: string }): string {
  if (!cargo.tag) return '/compendium/cargo'

  // Check cargo collections
  for (const collection of Object.values(cargoCollections)) {
    if (collection.tags.some((tag) => tag === cargo.tag)) {
      // Find the specific category href for this tag
      const category = collection.categories[cargo.tag as keyof typeof collection.categories]
      if (category) {
        return category.href
      }
    }
  }

  // Fallback to cargo collection root
  return '/compendium/cargo'
}

/**
 * Map CargoDesc to SearchItem
 */
export function mapCargoToSearchItem(cargo: CargoDesc): SearchItem {
  return {
    id: `cargo_${cargo.id}`,
    name: cargo.name,
    slug: createSlug(cargo.name),
    category: 'Cargo',
    type: 'cargo',
    href: getCargoCompendiumHref({ tag: cargo.tag }),
    tier: cargo.tier,
    rarity: convertRarityToString(cargo.rarity),
    tag: cargo.tag,
    description: cargo.description,
    icon_asset_name: getServerIconPath(cleanIconAssetName(cargo.iconAssetName || ''))
  }
}

/**
 * Transform cargo to search format
 */
export function transformCargoToSearch(cargo: CargoDesc[]): SearchItem[] {
  return cargo.map(mapCargoToSearchItem)
}
