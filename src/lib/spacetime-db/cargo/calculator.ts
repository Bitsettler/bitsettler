import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import { createSlug } from '../entities'
import { convertRarityToString } from '../rarity'
import { getServerIconPath, cleanIconAssetName } from '../assets'
import type { CalculatorItem } from '../calculator-dtos'

/**
 * Map CargoDesc to CalculatorItem
 */
export function mapCargoToCalculatorItem(cargo: CargoDesc): CalculatorItem {
  return {
    id: `cargo_${cargo.id}`,
    name: cargo.name,
    slug: createSlug(cargo.name),
    tier: cargo.tier,
    rarity: convertRarityToString(cargo.rarity),
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