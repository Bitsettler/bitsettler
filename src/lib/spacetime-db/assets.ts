/**
 * Get icon path from server icon asset name
 */
export function getServerIconPath(iconAssetName: string): string {
  if (!iconAssetName) {
    return '/assets/Unknown.webp'
  }

  // Handle paths that already have the full path
  if (iconAssetName.startsWith('GeneratedIcons/')) {
    return `/assets/${iconAssetName}.webp`
  }

  // Handle paths without the GeneratedIcons prefix
  return `/assets/GeneratedIcons/${iconAssetName}.webp`
}

/**
 * Check if an asset exists (placeholder for future implementation)
 */
export function assetExists(): boolean {
  // TODO: Implement asset existence checking
  return true
}

/**
 * Get fallback icon path for unknown assets
 */
export function getFallbackIconPath(): string {
  return '/assets/Unknown.webp'
}

/**
 * Clean icon asset name by removing redundant prefixes
 */
export function cleanIconAssetName(iconAssetName: string): string {
  if (!iconAssetName) return ''

  // Remove redundant GeneratedIcons prefix
  if (iconAssetName.startsWith('GeneratedIcons/Other/GeneratedIcons/')) {
    return iconAssetName.replace('GeneratedIcons/Other/GeneratedIcons/', 'GeneratedIcons/')
  }

  return iconAssetName
}
