import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import { getAllCargo } from './get-all-cargo'

/**
 * Get all cargo grouped by their tag
 */
export function getCargoGroupedByTag(): Record<string, CargoDesc[]> {
  const cargo = getAllCargo()

  return cargo.reduce(
    (groups, cargoItem) => {
      if (cargoItem.tag) {
        if (!groups[cargoItem.tag]) {
          groups[cargoItem.tag] = []
        }
        groups[cargoItem.tag].push(cargoItem)
      }
      return groups
    },
    {} as Record<string, CargoDesc[]>
  )
}
