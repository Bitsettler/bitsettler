import type { CollectibleWithItem } from '@/lib/spacetime-db/modules/collectibles/collectibles'
import { TagPageView } from '@/views/tag-views/tag-page-view'

interface CollectiblesIndividualTagPageViewProps {
  tagName: string
  collectibles: CollectibleWithItem[]
  backLink?: string
  backLinkText?: string
}

export function CollectiblesIndividualTagPageView({
  tagName,
  collectibles,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: CollectiblesIndividualTagPageViewProps) {
  // Create enriched items with collectible data
  const enrichedItems = collectibles.map((collectible) => ({
    ...collectible.item,
    // Override the iconAssetName for proper display
    iconAssetName: collectible.iconAssetName || collectible.item.iconAssetName,
    // Add collectible-specific properties if needed
    collectible: collectible
  }))

  // Create item groups
  const itemGroups = [
    {
      name: tagName,
      items: enrichedItems,
      columns: [
        {
          key: 'icon',
          label: 'Icon',
          sortable: false,
          className: 'w-16'
        },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
        { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' }
      ]
    }
  ]

  // Collectibles statistics
  const totalCollectibles = collectibles.length
  const rarityDistribution: Record<string, number> = {}
  collectibles.forEach((collectible) => {
    const rarity = collectible.item.rarity?.tag || 'Common'
    rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1
  })

  return (
    <TagPageView
      title={tagName}
      subtitle={`${totalCollectibles} collectible items in this category`}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
    />
  )
}
