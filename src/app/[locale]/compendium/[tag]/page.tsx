import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import { getCollectiblesWithItems } from '@/lib/spacetime-db/modules/collectibles/collectibles'
import { getConsumablesWithStats } from '@/lib/spacetime-db/modules/collections/consumables'
import { getEquipmentWithStats } from '@/lib/spacetime-db/modules/collections/equipments'
import { findTagCollection, tagCollections } from '@/lib/spacetime-db/modules/collections/item-tag-collections'
import { getToolsWithItems } from '@/lib/spacetime-db/modules/collections/tools'
import { ItemTag } from '@/lib/spacetime-db/modules/items/item-tags'
import { camelCaseDeep } from '@/lib/spacetime-db/shared/utils/case-utils'
import { CollectiblesIndividualTagPageView } from '@/views/collectibles-views/collectibles-individual-tag-page-view'
import { ConsumableIndividualTagPageView } from '@/views/consumables-views/consumables-individual-tag-page-view'
import { EquipmentIndividualTagPageView } from '@/views/equipment-views/equipment-individual-tag-page-view'
import { TagPageView } from '@/views/tag-views/tag-page-view'
import { ToolsIndividualTagPageView } from '@/views/tools-views/tools-individual-tag-page-view'
import { notFound } from 'next/navigation'

type CompendiumEntity = ItemDesc | ResourceDesc

// Generate static params for all possible tag combinations
export function generateStaticParams() {
  const tags = Object.values(ItemTag)

  // Exclude tags that conflict with specific routes
  const conflictingRoutes = ['weapon'] // lowercase versions of specific routes

  return tags
    .filter((tag) => !conflictingRoutes.includes(tag.toLowerCase()))
    .map((tag) => ({
      tag
    }))
}

interface PageProps {
  params: Promise<{
    tag: string
  }>
}

export default async function CompendiumCategoryPage({ params }: PageProps) {
  const { tag } = await params

  // Convert slug back to tag name
  const tagName = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  // Convert snake_case JSON to camelCase and type properly
  const itemData = camelCaseDeep<ItemDesc[]>(itemDescData)
  // const resourceData = camelCaseDeep<ResourceDesc[]>(resourceDescData)

  // Filter entries by tag
  const items = itemData.filter((item) => item.compendiumEntry && item.tag === tagName)
  // const resources = resourceData.filter((resource) => resource.compendiumEntry && resource.tag === tagName)

  // Combine all entities
  const allEntities: CompendiumEntity[] = [
    ...items
    // ...resources
  ]

  // If no entities found, return 404
  if (allEntities.length === 0) {
    notFound()
  }

  // Determine entity type
  const entityType = items.length > 0 ? 'Items' : 'Resources'

  // Check if this tag is an equipment tag
  const isEquipmentTag = tagCollections.equipment.tags.some((tag) => tag === tagName)

  // Check if this tag is a tools tag
  const isToolsTag = tagCollections.tools.tags.some((tag) => tag === tagName)

  // Check if this tag is a collectibles tag
  const isCollectiblesTag = tagCollections.collectibles.tags.some((tag) => tag === tagName)

  // Check if this tag is a consumables tag
  const isConsumablesTag = tagCollections.consumables.tags.some((tag) => tag === tagName)

  // Find which collection this tag belongs to for smart navigation
  const parentCollection = findTagCollection(tagName)

  // Handle equipment tags with the live component
  if (isEquipmentTag && items.length > 0) {
    try {
      const equipmentWithStats = await getEquipmentWithStats()
      const equipmentForThisTag = equipmentWithStats.filter((equipment) => equipment.item.tag === tagName)

      return (
        <EquipmentIndividualTagPageView
          tagName={tagName}
          equipment={equipmentForThisTag}
          backLink={parentCollection?.href || '/compendium'}
          backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
        />
      )
    } catch (error) {
      console.warn('Failed to fetch live equipment data during build, using static fallback:', error)
      // Fallback to empty data for build time
      return (
        <EquipmentIndividualTagPageView
          tagName={tagName}
          equipment={[]}
          backLink={parentCollection?.href || '/compendium'}
          backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
        />
      )
    }
  }

  // Handle tools tags with the new component
  if (isToolsTag && items.length > 0) {
    try {
      const toolsWithItems = await getToolsWithItems()
      const toolsForThisTag = toolsWithItems.filter((tool) => tool.item.tag === tagName)

      return (
        <ToolsIndividualTagPageView
          tagName={tagName}
          tools={toolsForThisTag}
          backLink={parentCollection?.href || '/compendium'}
          backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
        />
      )
    } catch (error) {
      console.warn('Failed to fetch live tools data during build, using static fallback:', error)
      return (
        <ToolsIndividualTagPageView
          tagName={tagName}
          tools={[]}
          backLink={parentCollection?.href || '/compendium'}
          backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
        />
      )
    }
  }

  // Handle collectibles tags with the new component
  if (isCollectiblesTag && items.length > 0) {
    try {
      const collectiblesWithItems = await getCollectiblesWithItems()
      const collectiblesForThisTag = collectiblesWithItems.filter((collectible) => collectible.item.tag === tagName)

      return (
        <CollectiblesIndividualTagPageView
          tagName={tagName}
          collectibles={collectiblesForThisTag}
          backLink={parentCollection?.href || '/compendium'}
          backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
        />
      )
    } catch (error) {
      console.warn('Failed to fetch live collectibles data during build, using static fallback:', error)
      return (
        <CollectiblesIndividualTagPageView
          tagName={tagName}
          collectibles={[]}
          backLink={parentCollection?.href || '/compendium'}
          backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
        />
      )
    }
  }

  // Handle consumables tags with the new component
  if (isConsumablesTag && items.length > 0) {
    try {
      const consumablesWithStats = await getConsumablesWithStats()
      const consumablesForThisTag = consumablesWithStats.filter((consumable) => consumable.tag === tagName)

      return (
        <ConsumableIndividualTagPageView
          tagName={tagName}
          consumables={consumablesForThisTag}
          backLink={parentCollection?.href || '/compendium'}
          backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
        />
      )
    } catch (error) {
      console.warn('Failed to fetch live consumables data during build, using static fallback:', error)
      return (
        <ConsumableIndividualTagPageView
          tagName={tagName}
          consumables={[]}
          backLink={parentCollection?.href || '/compendium'}
          backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
        />
      )
    }
  }

  // Handle non-equipment/tools tags (regular items, resources)
  const itemGroups = [
    {
      name: `${tagName}`,
      items: allEntities,
      columns: [
        { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
        { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' }
      ]
    }
  ]

  return (
    <TagPageView
      title={tagName}
      subtitle={`${allEntities.length} ${entityType.toLowerCase()} in this category`}
      backLink={parentCollection?.href || '/compendium'}
      backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
      itemGroups={itemGroups}
    />
  )
}
