import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import rawCargo from '@/data/global/cargo_desc.json'
import { camelCaseDeep } from '../utils/case-utils'
import type { CompendiumEntity } from './types'

/**
 * Filter entities to only include cargo
 */
export function filterToCargo(entities: CompendiumEntity[]): CargoDesc[] {
  return entities.filter((entity) => entity.entityType === 'cargo').map((entity) => entity as CargoDesc)
}

/**
 * Filter cargo by package type
 */
export function filterPackages(cargo: CargoDesc[]): CargoDesc[] {
  return cargo.filter((item) => item.tag === 'Package')
}

/**
 * Filter cargo by animal type
 */
export function filterAnimals(cargo: CargoDesc[]): CargoDesc[] {
  return cargo.filter((item) => item.tag === 'Animal')
}

/**
 * Filter cargo by traveler goods
 */
export function filterTravelerGoods(cargo: CargoDesc[]): CargoDesc[] {
  return cargo.filter((item) => item.tag === 'Traveler Goods')
}

/**
 * Filter cargo by vehicle type
 */
export function filterVehicles(cargo: CargoDesc[]): CargoDesc[] {
  return cargo.filter((item) => item.tag === 'Vehicle')
}

/**
 * Get cargo statistics by category
 */
export function getCargoStatsByCategory(cargo: CargoDesc[]): Record<string, number> {
  const stats: Record<string, number> = {}

  cargo.forEach((item) => {
    const category = item.tag || 'Uncategorized'
    stats[category] = (stats[category] || 0) + 1
  })

  return stats
}

/**
 * Check if cargo is transportable
 */
export function isTransportable(): boolean {
  // All cargo is transportable by definition
  return true
}

/**
 * Get tier distribution for cargo
 */
export function getCargoTierDistribution(cargo: CargoDesc[]): Record<number, number> {
  const distribution: Record<number, number> = {}

  cargo.forEach((item) => {
    distribution[item.tier] = (distribution[item.tier] || 0) + 1
  })

  return distribution
}

/**
 * Get cargo volume distribution (if volume data is available)
 */
export function getCargoVolumeDistribution(cargo: CargoDesc[]): Record<number, number> {
  const distribution: Record<number, number> = {}

  cargo.forEach((item) => {
    const volume = item.volume || 0
    distribution[volume] = (distribution[volume] || 0) + 1
  })

  return distribution
}

/**
 * Return all cargo entries from the global cargo description dataset.
 * The raw JSON uses snake_case keys, so we convert them to camelCase to
 * align with the generated CargoDesc binding type.
 */
export function getAllCargo(): CargoDesc[] {
  return camelCaseDeep<CargoDesc[]>(rawCargo)
}
