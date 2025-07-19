import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import cargoDescData from '@/data/global/cargo_desc.json'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'

// Convert snake_case JSON to camelCase and type properly
const cargo = camelCaseDeep<CargoDesc[]>(cargoDescData)

/**
 * Get all cargo items
 */
export function getAllCargo(): CargoDesc[] {
  return cargo
}