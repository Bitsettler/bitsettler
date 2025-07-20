import { getCargoWithStats, type CargoWithStats } from './get-cargo-with-stats'

/**
 * Get cargo grouped by tag, sorted by tier then by name
 */
export function getCargoGroupedByTag(): Record<string, CargoWithStats[]> {
  const cargo = getCargoWithStats()

  const grouped: Record<string, CargoWithStats[]> = {}

  for (const cargoItem of cargo) {
    const tag = cargoItem.tag
    if (!grouped[tag]) {
      grouped[tag] = []
    }
    grouped[tag].push(cargoItem)
  }

  // Sort each group by tier, then by name
  for (const tag in grouped) {
    grouped[tag].sort((a, b) => {
      // First sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Then sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get cargo grouped by category
 */
export function getCargoGroupedByCategory(): Record<string, CargoWithStats[]> {
  const cargo = getCargoWithStats()

  const grouped: Record<string, CargoWithStats[]> = {}

  for (const cargoItem of cargo) {
    const category = cargoItem.cargoCategory
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(cargoItem)
  }

  // Sort each group by tag, then by tier, then by name
  for (const category in grouped) {
    grouped[category].sort((a, b) => {
      // First sort by tag
      if (a.tag !== b.tag) {
        return a.tag.localeCompare(b.tag)
      }
      // Then sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Finally sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}

/**
 * Get cargo grouped by volume (raw game value)
 */
export function getCargoGroupedByVolume(): Record<string, CargoWithStats[]> {
  const cargo = getCargoWithStats()

  const grouped: Record<string, CargoWithStats[]> = {}

  for (const cargoItem of cargo) {
    const volume = cargoItem.volume.toString() // Use actual volume value
    if (!grouped[volume]) {
      grouped[volume] = []
    }
    grouped[volume].push(cargoItem)
  }

  // Sort each group by volume, then by tier, then by name
  for (const volume in grouped) {
    grouped[volume].sort((a, b) => {
      // First sort by actual volume
      if (a.volume !== b.volume) {
        return a.volume - b.volume
      }
      // Then sort by tier
      if (a.tier !== b.tier) {
        return a.tier - b.tier
      }
      // Finally sort by name
      return a.name.localeCompare(b.name)
    })
  }

  return grouped
}
