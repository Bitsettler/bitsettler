import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import { tagCollections } from '@/lib/spacetime-db-new/modules/collections/item-tag-collections'
import { getEquipmentWithStats } from '@/lib/spacetime-db-new/modules/equipment/flows'
import {
  getAllConsumables,
  getAllItems
} from '@/lib/spacetime-db-new/modules/items/commands'
import { getToolsWithStats } from '@/lib/spacetime-db-new/modules/tools/flows'
import { slugToTitleCase } from '@/lib/spacetime-db-new/shared/utils/entities'
import { ConsumableIndividualTagPageView } from '@/views/consumables-views/consumables-individual-tag-page-view'
import { EquipmentIndividualTagPageView } from '@/views/equipment-views/equipment-individual-tag-page-view'
import { TagPageView } from '@/views/tag-views/tag-page-view'
import { ToolsIndividualTagPageView } from '@/views/tools-views/tools-individual-tag-page-view'
import { notFound } from 'next/navigation'

function findTagCollection(tagName: string) {
  for (const [, collection] of Object.entries(tagCollections)) {
    if ((collection.tags as readonly string[]).includes(tagName)) {
      return collection
    }
  }
  return null
}

type CompendiumEntity = ItemDesc | ResourceDesc

interface PageProps {
  params: Promise<{
    tag: string
  }>
}

export default async function CompendiumCategoryPage({ params }: PageProps) {
  const { tag } = await params

  // Convert slug back to tag name using standardized function
  const tagName = slugToTitleCase(tag)

  // Get items using new SDK functions
  const allItems = getAllItems()

  // Filter entries by tag
  const items = allItems.filter(
    (item) => item.compendiumEntry && item.tag === tagName
  )

  // Combine all entities (currently just items, resources can be added later)
  const allEntities: CompendiumEntity[] = [...items]

  // If no entities found, return 404
  if (allEntities.length === 0) {
    notFound()
  }

  // Determine entity type
  const entityType = items.length > 0 ? 'Items' : 'Resources'

  // Check if this tag is an equipment tag
  const isEquipmentTag = tagCollections.equipment.tags.some(
    (tag) => tag === tagName
  )

  // Check if this tag is a tools tag
  const isToolsTag = tagCollections.tools.tags.some((tag) => tag === tagName)

  // Check if this tag is a consumables tag
  const isConsumablesTag = tagCollections.consumables.tags.some(
    (tag) => tag === tagName
  )

  // Find which collection this tag belongs to for smart navigation
  const parentCollection = findTagCollection(tagName)

  // Handle equipment tags with the live component
  if (isEquipmentTag && items.length > 0) {
    const equipmentWithStats = getEquipmentWithStats()
    const equipmentForThisTag = equipmentWithStats.filter(
      (equipment) => equipment.item.tag === tagName
    )

    return (
      <EquipmentIndividualTagPageView
        tagName={tagName}
        equipment={equipmentForThisTag}
        backLink={parentCollection?.href || '/compendium'}
        backLinkText={
          parentCollection
            ? `← Back to ${parentCollection.name}`
            : '← Back to Compendium'
        }
      />
    )
  }

  // Handle tools tags with the new component
  if (isToolsTag && items.length > 0) {
    const toolsWithStats = getToolsWithStats()
    const toolsForThisTag = toolsWithStats.filter(
      (tool) => tool.item.tag === tagName
    )

    return (
      <ToolsIndividualTagPageView
        tagName={tagName}
        tools={toolsForThisTag}
        backLink={parentCollection?.href || '/compendium'}
        backLinkText={
          parentCollection
            ? `← Back to ${parentCollection.name}`
            : '← Back to Compendium'
        }
      />
    )
  }

  // Handle consumables tags with the new component
  if (isConsumablesTag && items.length > 0) {
    const allConsumables = getAllConsumables()
    const consumablesForThisTag = allConsumables.filter(
      (consumable) => consumable.tag === tagName
    )

    return (
      <ConsumableIndividualTagPageView
        tagName={tagName}
        tagSlug={tag}
        consumables={consumablesForThisTag}
        backLink={parentCollection?.href || '/compendium'}
        backLinkText={
          parentCollection
            ? `← Back to ${parentCollection.name}`
            : '← Back to Compendium'
        }
      />
    )
  }

  // Handle non-equipment/tools tags (regular items, resources)
  const itemGroups = [
    {
      name: `${tagName}`,
      items: allEntities,
      columns: [
        { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
        { key: 'name', label: 'Name', sortable: true },
        {
          key: 'tier',
          label: 'Tier',
          sortable: true,
          className: 'text-center'
        },
        {
          key: 'rarity',
          label: 'Rarity',
          sortable: true,
          className: 'text-center'
        }
      ]
    }
  ]

  return (
    <TagPageView
      title={tagName}
      subtitle={`${allEntities.length} ${entityType.toLowerCase()} in this category`}
      backLink={parentCollection?.href || '/compendium'}
      backLinkText={
        parentCollection
          ? `← Back to ${parentCollection.name}`
          : '← Back to Compendium'
      }
      itemGroups={itemGroups}
      enableItemLinks={true}
      tagSlug={tag}
    />
  )
}
