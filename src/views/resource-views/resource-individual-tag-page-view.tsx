import { type ResourceWithStats } from '@/lib/spacetime-db-live/resources/resources'
import { TagPageView } from '@/views/tag-page-view/tag-page-view'

interface ResourceIndividualTagPageViewProps {
  tagName: string
  resources: ResourceWithStats[]
  backLink?: string
  backLinkText?: string
}

export function ResourceIndividualTagPageView({
  tagName,
  resources,
  backLink = '/compendium/resources',
  backLinkText = '← Back to Resources'
}: ResourceIndividualTagPageViewProps) {
  // Group by tier for better organization
  const resourcesByTier: Record<number, ResourceWithStats[]> = {}
  resources.forEach((item) => {
    const tier = item.tier
    if (!resourcesByTier[tier]) {
      resourcesByTier[tier] = []
    }
    resourcesByTier[tier].push(item)
  })

  // Create item groups for each tier
  const itemGroups = Object.entries(resourcesByTier)
    .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by tier number
    .map(([tierString, resourceItems]) => {
      const tier = parseInt(tierString)
      
      // Collect all unique biomes for this tier
      const tierBiomes = new Set<string>()
      resourceItems.forEach(item => {
        item.availableBiomes.forEach(biome => {
          if (biome !== 'Unknown') {
            tierBiomes.add(biome)
          }
        })
      })
      
      const biomesArray = Array.from(tierBiomes).sort()
      const biomesText = biomesArray.length > 0 ? biomesArray.join(', ') : 'Unknown'

      // Create base columns (removed Biomes column since it's now in the section header)
      const baseColumns = [
        { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' },
        { key: 'maxHealth', label: 'Health', sortable: true, className: 'text-center' }
      ]

      // Add resource-specific columns
      const resourceColumns = [
        { key: 'yieldDescription', label: 'Yield', sortable: true, className: 'text-center' }
      ]

      // Add conditional columns based on resource properties
      const hasRespawningItems = resourceItems.some((item) => !item.isRespawning)
      const respawningColumn = hasRespawningItems
        ? [{ key: 'isRespawning', label: 'Respawns', sortable: true, className: 'text-center' }]
        : []

      // Create enriched items with proper rarity fallback and formatted data
      const enrichedItems = resourceItems.map((resourceItem) => ({
        ...resourceItem,
        rarity: resourceItem.rarity || { tag: 'Common' },
        // Format boolean values for display
        isRespawning: resourceItem.isRespawning ? 'Yes' : 'No',
        isHarvestable: resourceItem.isHarvestable ? 'Yes' : 'No',
        isNaturallyOccurring: resourceItem.isNaturallyOccurring ? 'Yes' : 'No'
      }))

      return {
        name: `Tier ${tier} ${tagName}`,
        subtitle: biomesArray.length > 0 ? `Found in: ${biomesText}` : 'Biome: Unknown',
        items: enrichedItems,
        columns: [...baseColumns, ...resourceColumns, ...respawningColumn]
      }
    })

  // Resource statistics
  const totalResources = resources.length
  const harvestableCount = resources.filter((r) => r.isHarvestable).length
  const naturalCount = resources.filter((r) => r.isNaturallyOccurring).length
  const respawningCount = resources.filter((r) => r.isRespawning).length
  const uniqueBiomes = new Set(resources.flatMap((r) => r.availableBiomes)).size

  // Create subtitle with breakdown
  const subtitleParts = [`${totalResources} resources`]
  if (harvestableCount > 0) subtitleParts.push(`${harvestableCount} harvestable`)
  if (naturalCount > 0) subtitleParts.push(`${naturalCount} natural`)
  if (respawningCount > 0) subtitleParts.push(`${respawningCount} respawning`)
  if (uniqueBiomes > 0) subtitleParts.push(`${uniqueBiomes} biomes`)

  const subtitle = subtitleParts.join(' • ')

  return (
    <TagPageView
      title={tagName}
      subtitle={subtitle}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
    />
  )
}

