/**
 * Get icon path from server icon asset name
 */
export function getServerIconPath(iconAssetName: string | undefined): string {
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
 * Clean icon asset name by removing redundant prefixes
 */
export function cleanIconAssetName(iconAssetName: string | undefined): string | undefined {
  if (!iconAssetName) return undefined

  // Fix the common issue where "GeneratedIcons/Other/GeneratedIcons" is duplicated
  let cleanPath = iconAssetName.replace('GeneratedIcons/Other/GeneratedIcons/Other/', 'GeneratedIcons/Other/')
  cleanPath = cleanPath.replace('GeneratedIcons/Other/GeneratedIcons', 'GeneratedIcons')

  // Handle specific cosmetic item path fixes
  if (cleanPath === 'Items/LeatherBonnet') {
    cleanPath = 'GeneratedIcons/Other/Cosmetics/Head/Hat_BurlapBonnet'
  }

  if (cleanPath === 'Items/LeatherGloves') {
    cleanPath = 'GeneratedIcons/Other/Cosmetics/Hands/Hands_BasicGloves'
  }

  if (cleanPath === 'Items/HexCoin[,3,10,500]') {
    cleanPath = 'GeneratedIcons/Items/HexCoin'
  }

  // Fix hair color filename mismatches (data references vs actual filenames)
  if (cleanPath === 'GeneratedIcons/Other/Cosmetics/HailColor/Orange') {
    cleanPath = 'GeneratedIcons/Other/Cosmetics/HailColor/Ginger'
  }
  if (cleanPath === 'GeneratedIcons/Other/Cosmetics/HailColor/Blonde') {
    cleanPath = 'GeneratedIcons/Other/Cosmetics/HailColor/LightBrown'
  }
  if (cleanPath === 'GeneratedIcons/Other/Cosmetics/HailColor/Red') {
    cleanPath = 'GeneratedIcons/Other/Cosmetics/HailColor/Ginger'
  }
  if (cleanPath === 'GeneratedIcons/Other/Cosmetics/HailColor/Blue') {
    cleanPath = 'GeneratedIcons/Other/Cosmetics/HailColor/Hexite'
  }
  if (cleanPath === 'GeneratedIcons/Other/Cosmetics/HailColor/Purple') {
    cleanPath = 'GeneratedIcons/Other/Cosmetics/HailColor/DarkGray'
  }
  if (cleanPath === 'GeneratedIcons/Other/Cosmetics/HailColor/Green') {
    cleanPath = 'GeneratedIcons/Other/Cosmetics/HailColor/Ginger'
  }
  if (cleanPath === 'GeneratedIcons/Other/Cosmetics/HailColor/Pink') {
    cleanPath = 'GeneratedIcons/Other/Cosmetics/HailColor/LightBrown'
  }

  return cleanPath
}
