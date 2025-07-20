import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import cargoDescData from '@/data/sdk-tables/cargo_desc.json'

// SDK data is already in camelCase format, no transformation needed
const cargo = cargoDescData as CargoDesc[]

/**
 * Get all cargo items from SDK data
 */
export function getAllCargo(): CargoDesc[] {
  return cargo
}