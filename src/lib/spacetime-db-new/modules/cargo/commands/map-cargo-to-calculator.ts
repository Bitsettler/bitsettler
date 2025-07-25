import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import { cleanIconAssetName, getServerIconPath } from '../../../shared/assets'
import type { CalculatorItem } from '../../../shared/dtos/calculator-dtos'
import { createSlug } from '../../../shared/utils/entities'

/**
 * Map CargoDesc to CalculatorItem
 */
export function mapCargoToCalculatorItem(cargo: CargoDesc): CalculatorItem {
  return {
    id: `cargo_${cargo.id}`,
    name: cargo.name,
    slug: createSlug(cargo.name),
    tier: cargo.tier,
    rarity: cargo.rarity.tag.toLowerCase(),
    category: 'cargo',
    description: cargo.description || 'No description available',
    icon_asset_name: getServerIconPath(cleanIconAssetName(cargo.iconAssetName || ''))
  }
}

/**
 * Transform cargo to calculator format
 */
export function transformCargoToCalculator(cargo: CargoDesc[]): CalculatorItem[] {
  return cargo.map(mapCargoToCalculatorItem)
}
