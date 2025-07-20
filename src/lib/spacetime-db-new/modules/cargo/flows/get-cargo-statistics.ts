import { getAllCargo } from '../commands/get-all-cargo'

interface CargoStatistics {
  total: number
  uniqueTags: number
}

/**
 * Get comprehensive statistics about cargo
 */
export function getCargoStatistics(): CargoStatistics {
  const cargo = getAllCargo()
  
  const uniqueTags = new Set(cargo.map(c => c.tag).filter(Boolean)).size
  
  return {
    total: cargo.length,
    uniqueTags
  }
}