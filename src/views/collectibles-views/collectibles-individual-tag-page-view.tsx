'use client'

import type { CollectibleWithDeed } from '@/lib/spacetime-db-new/modules/collectibles/flows'
import {
  cleanIconAssetName,
  getServerIconPath
} from '@/lib/spacetime-db-new/shared/assets'
import type { BaseItem } from '@/views/tag-views/tag-page-view'
import { TagPageView } from '@/views/tag-views/tag-page-view'
import Image from 'next/image'

interface CollectiblesIndividualTagPageViewProps {
  tagName: string
  collectibles: CollectibleWithDeed[]
  backLink?: string
  backLinkText?: string
}

export function CollectiblesIndividualTagPageView({
  tagName,
  collectibles,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: CollectiblesIndividualTagPageViewProps) {
  // Transform collectibles to BaseItem format for TagPageView
  const transformedItems = collectibles.map((item) => ({
    id: item.collectible.id,
    name: item.collectible.name,
    description: item.collectible.description,
    iconAssetName: item.collectible.iconAssetName,
    tier: -1, // Collectibles don't have tiers, using -1 for items without tiers
    rarity: item.collectible.collectibleRarity,
    // Add deed info for custom rendering
    deedIconAssetName: item.deed?.iconAssetName
  }))

  // Create item groups
  const itemGroups = [
    {
      name: tagName,
      items: transformedItems,
      columns: [
        {
          key: 'icon',
          label: 'Icon',
          sortable: false,
          className: 'w-16'
        },
        { key: 'name', label: 'Name', sortable: true },
        {
          key: 'rarity',
          label: 'Rarity',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'deedIconAssetName',
          label: 'Deed',
          sortable: false,
          className: 'w-16',
          render: (item: BaseItem & { deedIconAssetName?: string }) =>
            item.deedIconAssetName ? (
              <div className="bg-muted relative h-13 w-13 rounded p-1">
                <Image
                  src={getServerIconPath(
                    cleanIconAssetName(item.deedIconAssetName)
                  )}
                  alt="Deed"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : null
        }
      ]
    }
  ]

  // Collectibles statistics
  const totalCollectibles = collectibles.length
  const rarityDistribution: Record<string, number> = {}
  collectibles.forEach((item) => {
    const rarity = item.collectible.collectibleRarity?.tag || 'Default'
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
