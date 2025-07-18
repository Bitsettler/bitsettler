import type { BuildingWithConstructionInfo } from '@/lib/spacetime-db/modules/buildings/buildings'
import { TagPageView } from '@/views/tag-views/tag-page-view'

interface BuildingsIndividualCategoryPageViewProps {
  categoryName: string
  buildings: BuildingWithConstructionInfo[]
  backLink?: string
  backLinkText?: string
}

export function BuildingsIndividualCategoryPageView({
  categoryName,
  buildings,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: BuildingsIndividualCategoryPageViewProps) {
  // Create enriched items for the table view - all data is already enriched from the data layer
  const enrichedItems = buildings.map((building) => ({
    ...building,
    // Add missing BaseItem properties for TagPageView compatibility
    tier: 1, // Buildings don't have tiers, default to 1
    rarity: { tag: 'Common' } as const, // Buildings don't have rarity, default to Common
    // Add UI-specific properties for table display
    buildingType: building.buildingType?.name || 'Unknown',
    functions: building.formattedFunctions || 'None',
    constructionRequired: building.constructionRecipe ? 'Yes' : 'No'
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
        { key: 'buildingType', label: 'Type', sortable: true, className: 'text-center' },
        { key: 'maxHealth', label: 'Health', sortable: true, className: 'text-center' },
        { key: 'defenseLevel', label: 'Defense', sortable: true, className: 'text-center' },
        { key: 'lightRadius', label: 'Light Radius', sortable: true, className: 'text-center' },
        { key: 'functions', label: 'Functions', sortable: true, className: 'text-center' },
        { key: 'constructionRequired', label: 'Construction', sortable: true, className: 'text-center' }
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
