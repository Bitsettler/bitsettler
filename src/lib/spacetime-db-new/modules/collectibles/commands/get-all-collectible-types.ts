import { getAllCollectibles } from './get-all-collectibles'

/**
 * Get all unique collectible types
 */
export function getAllCollectibleTypes(): string[] {
  const collectibles = getAllCollectibles()
  const typeSet = new Set<string>()

  collectibles.forEach((collectible) => {
    if (collectible.collectibleType?.tag) {
      typeSet.add(collectible.collectibleType.tag)
    }
  })

  return Array.from(typeSet).sort()
}
