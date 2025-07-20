import { getAllCargo } from './get-all-cargo'

/**
 * Get all unique cargo tags from SDK data
 */
export function getAllCargoTags(): string[] {
  const cargo = getAllCargo()
  const tags = new Set<string>()
  
  cargo.forEach(cargoItem => {
    if (cargoItem.tag) {
      tags.add(cargoItem.tag)
    }
  })
  
  return Array.from(tags).sort()
}