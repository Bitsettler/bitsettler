import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import { getAllCargo } from '../commands/get-all-cargo'
import { getCargoCategory } from '../commands/get-cargo-category'
import {
  isAnimalType,
  isMaterialType,
  isVehicleType,
  isPackageType,
  isTradingGoodsType
} from '../commands/check-cargo-types'

// Combined cargo data with computed properties
export interface CargoWithStats extends CargoDesc {
  cargoCategory: string
  isTransportable: boolean
  isAnimal: boolean
  isMaterial: boolean
  isVehicle: boolean
  isPackage: boolean
  isTradingGoods: boolean
  // Note: Using raw game values instead of fake categories:
  // - volume: actual number from game data
  // - movementModifier: actual number from game data  
  // - pickUpTime: actual number from game data
  // - notPickupable: actual boolean from game data
}

/**
 * Get cargo with computed properties and enriched data
 */
export function getCargoWithStats(): CargoWithStats[] {
  const cargoDesc = getAllCargo()
  const results: CargoWithStats[] = []

  for (const cargo of cargoDesc) {
    // Calculate computed properties (keeping only legitimate ones)
    const cargoCategory = getCargoCategory(cargo.tag)
    const isTransportable = !cargo.notPickupable
    const isAnimal = isAnimalType(cargo.tag)
    const isMaterial = isMaterialType(cargo.tag)
    const isVehicle = isVehicleType(cargo.tag)
    const isPackage = isPackageType(cargo.tag)
    const isTradingGoods = isTradingGoodsType(cargo.tag)

    results.push({
      ...cargo,
      cargoCategory,
      isTransportable,
      isAnimal,
      isMaterial,
      isVehicle,
      isPackage,
      isTradingGoods
      // Raw game values are already available via CargoDesc properties:
      // - cargo.volume (number)
      // - cargo.movementModifier (number) 
      // - cargo.pickUpTime (number)
      // - cargo.notPickupable (boolean)
    })
  }

  return results
}

/**
 * Alias for consistency with other modules
 */
export function getCargoWithItems(): CargoWithStats[] {
  return getCargoWithStats()
}