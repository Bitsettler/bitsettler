import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getAllCargo } from './get-all-cargo'

/**
 * Get cargo by slug (handles special characters properly)
 */
export function getCargoBySlug(slug: string): CargoDesc[] {
  const allCargo = getAllCargo()
  return allCargo.filter((cargo) => cargo.tag && createSlug(cargo.tag) === slug)
}
