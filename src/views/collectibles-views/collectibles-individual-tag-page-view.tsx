import type { ItemDesc } from '@/data/bindings/item_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import { getAllCollectibles } from '@/lib/spacetime-db/items/collectibles'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import { TagPageView } from '@/views/tag-page-view/tag-page-view'

interface CollectiblesIndividualTagPageViewProps {
  tagName: string
  backLink?: string
  backLinkText?: string
}

export function CollectiblesIndividualTagPageView({
  tagName,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: CollectiblesIndividualTagPageViewProps) {
  // Get all collectibles
  const allCollectibles = getAllCollectibles()

  // Get deed items data
  const itemData = camelCaseDeep<ItemDesc[]>(itemDescData)

  // Create a map of collectibles by their deed item ID
  const collectiblesByDeedId = new Map()
  allCollectibles.forEach((collectible) => {
    collectiblesByDeedId.set(collectible.itemDeedId, collectible)
  })

  // Filter deed items for this tag that have associated collectibles
  const deedItemsForThisTag = itemData.filter(
    (item) => item.compendiumEntry && item.tag === tagName && collectiblesByDeedId.has(item.id)
  )

  // Create enriched items with collectible icon paths
  const enrichedItems = deedItemsForThisTag.map((item) => ({
    ...item,
    // Override the iconAssetName for proper display
    iconAssetName: (() => {
      const collectible = collectiblesByDeedId.get(item.id)
      return collectible?.iconAssetName || item.iconAssetName
    })(),
    // Add collectible-specific properties if needed
    collectible: collectiblesByDeedId.get(item.id)
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
  const totalCollectibles = deedItemsForThisTag.length
  const rarityDistribution: Record<string, number> = {}
  deedItemsForThisTag.forEach((item) => {
    const rarity = item.rarity || 'common'
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

