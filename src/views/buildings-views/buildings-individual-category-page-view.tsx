import type { BuildingDesc } from '@/data/bindings/building_desc_type'
import { TagPageView } from '@/views/tag-views/tag-page-view'

interface BuildingsIndividualCategoryPageViewProps {
  categoryName: string
  buildings: BuildingDesc[]
  backLink?: string
  backLinkText?: string
}

export function BuildingsIndividualCategoryPageView({
  categoryName,
  buildings,
  backLink = '/compendium/buildings',
  backLinkText = '← Back to Buildings'
}: BuildingsIndividualCategoryPageViewProps) {
  // Create enriched items for the table view using SDK building data
  const enrichedItems = buildings.map((building) => ({
    ...building,
    // Add missing BaseItem properties for TagPageView compatibility
    tier: 1, // Buildings don't have tiers, default to 1
    rarity: { tag: 'Common' } as const, // Buildings don't have rarity, default to Common
    // Format functions for display
    functions: building.functions?.map(f => f.functionType).join(', ') || 'None',
    // Simplified health display
    health: building.maxHealth === -1 ? 'Indestructible' : building.maxHealth.toString(),
    // Defense level display
    defense: building.defenseLevel.toString(),
    // Light radius display
    light: building.lightRadius > 0 ? building.lightRadius.toString() : 'None'
  }))

  // Create item groups for the table
  const itemGroups = [
    {
      name: categoryName,
      items: enrichedItems,
      columns: [
        {
          key: 'icon',
          label: 'Icon',
          sortable: false,
          className: 'w-16'
        },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'health', label: 'Health', sortable: true, className: 'text-center' },
        { key: 'defense', label: 'Defense', sortable: true, className: 'text-center' },
        { key: 'light', label: 'Light', sortable: true, className: 'text-center' },
        { key: 'functions', label: 'Functions', sortable: false, className: 'text-center' }
      ]
    }
  ]

  // Building statistics for this category
  const totalBuildings = buildings.length

  return (
    <TagPageView
      title={categoryName}
      subtitle={`${totalBuildings} buildings in this category`}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
    />
  )
}
