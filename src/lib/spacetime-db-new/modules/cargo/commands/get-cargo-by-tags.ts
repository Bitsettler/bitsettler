import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import { getAllCargo } from './get-all-cargo'

/**
 * Get cargo filtered by one or more tags
 */
export function getCargoByTags(tags: string[]): CargoDesc[] {
  const allCargo = getAllCargo()
  return allCargo.filter((cargo) => cargo.tag && tags.includes(cargo.tag))
}
