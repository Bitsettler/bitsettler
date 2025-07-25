import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { TagPageView } from '@/views/tag-views/tag-page-view'

interface ResourceIndividualTagPageViewProps {
  tagName: string
  resources: ResourceDesc[]
  backLink?: string
  backLinkText?: string
}

export function ResourceIndividualTagPageView({
  tagName,
  resources,
  backLink = '/compendium/resources',
  backLinkText = '← Back to Resources'
}: ResourceIndividualTagPageViewProps) {
  // Create base columns
  const baseColumns = [
    { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
    { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' },
    { key: 'maxHealth', label: 'Health', sortable: true, className: 'text-center' }
  ]

  // Add resource-specific columns
  const resourceColumns = [{ key: 'yieldDescription', label: 'Yield', sortable: true, className: 'text-center' }]

  // Create enriched items with proper rarity fallback and formatted data
  const enrichedItems = resources.map((resourceItem) => ({
    ...resourceItem,
    rarity: resourceItem.rarity || { tag: 'Common' },
    // Add yield description from maxHealth
    yieldDescription: resourceItem.maxHealth ? `${resourceItem.maxHealth} HP` : 'Unknown'
  }))

  // Create single item group with tag name as title
  const itemGroups = [
    {
      name: tagName,
      items: enrichedItems,
      columns: [...baseColumns, ...resourceColumns]
    }
  ]

  // Resource statistics based on SDK data
  const totalResources = resources.length
  const respawningCount = resources.filter((r) => !r.notRespawning).length
  const flattenableCount = resources.filter((r) => r.flattenable).length
  const tiers = new Set(resources.map((r) => r.tier)).size

  // Create subtitle with breakdown
  const subtitleParts = [`${totalResources} resources`]
  if (respawningCount > 0) subtitleParts.push(`${respawningCount} respawning`)
  if (flattenableCount > 0) subtitleParts.push(`${flattenableCount} flattenable`)
  if (tiers > 1) subtitleParts.push(`${tiers} tiers`)

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
