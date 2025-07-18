import { getBuildingStatistics } from '@/lib/spacetime-db/modules/buildings/buildings'
import { BuildingsView } from '@/views/buildings-views/buildings-index-page-view'

// Category icons mapping
const categoryIcons: Record<string, string> = {
  Storage: '📦',
  Crafting: '🔨',
  Residential: '🏠',
  TownHall: '🏛️',
  Wall: '🧱',
  TradingPost: '🏪',
  Ornamental: '🎨',
  AncientRuins: '🏚️',
  ClaimTotem: '🗿',
  TerrraformingBase: '🏗️',
  Barter: '💰',
  Portal: '🌀',
  RentTerminal: '💳',
  Watchtower: '🗼',
  EmpireFoundry: '⚒️',
  Sign: '🪧',
  Gate: '🚪',
  Bed: '🛏️',
  Waystone: '🗻',
  Bank: '🏦',
  Elevator: '🛗',
  TownMarket: '🏬',
  RecoveryChest: '💼',
  PlayerHousing: '🏡',
  Uncategorized: '🏢'
}

// Utility function to format category names (PascalCase to Title Case)
function formatCategoryName(categoryName: string): string {
  // Convert PascalCase to Title Case with spaces
  return categoryName.replace(/([A-Z])/g, ' $1').trim()
}

// Utility function to convert PascalCase to kebab-case
function pascalToKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
}

export default async function BuildingsPage() {
  // Get live building statistics and categories
  const buildingStats = await getBuildingStatistics()

  // Create building categories with counts and metadata
  const buildingCategories = buildingStats.buildingsByCategory
    .map((categoryData) => ({
      id: pascalToKebabCase(categoryData.category),
      name: formatCategoryName(categoryData.category),
      originalName: categoryData.category, // Keep original for lookups
      description: getBuildingCategoryDescription(categoryData.category),
      icon: categoryIcons[categoryData.category] || '🏢',
      count: categoryData.count,
      href: `/compendium/buildings/${pascalToKebabCase(categoryData.category)}`,
      category: 'Buildings & Structures'
    }))
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by formatted name

  const totalBuildings = buildingStats.totalBuildings

  return (
    <BuildingsView
      title="Buildings & Structures"
      subtitle={`${totalBuildings} buildings across ${buildingCategories.length} categories`}
      buildingCategories={buildingCategories}
    />
  )
}

function getBuildingCategoryDescription(categoryName: string): string {
  const descriptions: Record<string, string> = {
    Storage: 'Buildings for storing items, resources, and cargo',
    Crafting: 'Workshops, forges, and other crafting facilities',
    Residential: 'Housing and living accommodations for citizens',
    TownHall: 'Administrative and governance buildings',
    Wall: 'Defensive structures and fortifications',
    TradingPost: 'Commercial buildings for trade and commerce',
    Ornamental: 'Decorative and aesthetic structures',
    AncientRuins: 'Mysterious ancient structures and ruins',
    ClaimTotem: 'Territory markers and claim management structures',
    TerrraformingBase: 'Environmental modification and terraforming facilities',
    Barter: 'Trading and bartering facilities',
    Portal: 'Transportation and teleportation structures',
    RentTerminal: 'Property rental and management stations',
    Watchtower: 'Observation and surveillance structures',
    EmpireFoundry: 'Large-scale industrial and empire facilities',
    Sign: 'Information and directional signage',
    Gate: 'Entry points and access control structures',
    Bed: 'Rest and recovery facilities',
    Waystone: 'Navigation and fast travel markers',
    Bank: 'Financial institutions and vaults',
    Elevator: 'Vertical transportation structures',
    TownMarket: 'Marketplace and trading centers',
    RecoveryChest: 'Item recovery and safety storage',
    PlayerHousing: 'Personal player residences and homes',
    Uncategorized: 'Other miscellaneous structures'
  }

  return descriptions[categoryName] || 'Various building structures and facilities'
}
