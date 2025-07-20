import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { TagPageView } from '@/views/tag-views/tag-page-view'

interface ConsumableIndividualTagPageViewProps {
  tagName: string
  consumables: ItemDesc[]
  backLink?: string
  backLinkText?: string
}

export function ConsumableIndividualTagPageView({
  tagName,
  consumables,
  backLink = '/compendium/consumables',
  backLinkText = '← Back to Consumables'
}: ConsumableIndividualTagPageViewProps) {
  // Create base columns
  const baseColumns = [
    { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
    { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' },
    { key: 'description', label: 'Description', sortable: true }
  ]

  // Create enriched items with proper rarity fallback
  const enrichedItems = consumables.map((consumable) => ({
    ...consumable,
    rarity: consumable.rarity || { tag: 'Common' }
  }))

  // Create single item group with tag name as title
  const itemGroups = [{
    name: tagName,
    items: enrichedItems,
    columns: baseColumns
  }]

  // Consumable statistics
  const totalConsumables = consumables.length
  // Simplified statistics based on tag patterns
  const tiers = new Set(consumables.map(c => c.tier)).size
  
  // Create subtitle with breakdown
  const subtitleParts = [`${totalConsumables} items`]
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
