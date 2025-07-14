import { type ResourceWithStats } from '@/lib/spacetime-db-live/resources'
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
  // Group by biome for better organization
  const resourcesByBiome: Record<string, ResourceWithStats[]> = {}
  resources.forEach((item) => {
    const primaryBiome = item.primaryBiome || 'Unknown'
    if (!resourcesByBiome[primaryBiome]) {
      resourcesByBiome[primaryBiome] = []
    }
    resourcesByBiome[primaryBiome].push(item)
  })

  // Create item groups for each biome
  const itemGroups = Object.entries(resourcesByBiome).map(([biomeName, resourceItems]) => {
    // Create base columns
    const baseColumns = [
      { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
      { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' },
      { key: 'maxHealth', label: 'Health', sortable: true, className: 'text-center' }
    ]

    // Add resource-specific columns
    const resourceColumns = [
      { key: 'healthCategory', label: 'Durability', sortable: true, className: 'text-center' },
      { key: 'yieldDescription', label: 'Yield', sortable: true, className: 'text-center' },
      { key: 'availableBiomes', label: 'Biomes', sortable: false, className: 'text-center' }
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
      isNaturallyOccurring: resourceItem.isNaturallyOccurring ? 'Yes' : 'No',
      // Format biomes list for display
      availableBiomes:
        resourceItem.availableBiomes.length > 0
          ? resourceItem.availableBiomes.slice(0, 2).join(', ') +
            (resourceItem.availableBiomes.length > 2 ? ` +${resourceItem.availableBiomes.length - 2}` : '')
          : 'Unknown'
    }))

    return {
      name: biomeName === 'Unknown' ? 'Unknown Biome' : `${biomeName} Biome`,
      items: enrichedItems,
      columns: [...baseColumns, ...resourceColumns, ...respawningColumn]
    }
  })

  // Sort groups by biome name
  itemGroups.sort((a, b) => {
    // Put "Unknown Biome" last
    if (a.name === 'Unknown Biome') return 1
    if (b.name === 'Unknown Biome') return -1
    return a.name.localeCompare(b.name)
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

