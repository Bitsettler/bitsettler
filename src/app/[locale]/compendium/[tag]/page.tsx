import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import cargoDescData from '@/data/global/cargo_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import { getCollectiblesWithItems } from '@/lib/spacetime-db-live/collectibles'
import { getEquipmentWithStats } from '@/lib/spacetime-db-live/equipments'
import { getToolsWithItems } from '@/lib/spacetime-db-live/tools'
import { findTagCollection, tagCollections } from '@/lib/spacetime-db/items/tag-collections'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import { CollectiblesIndividualTagPageView } from '@/views/collectibles-views/collectibles-individual-tag-page-view'
import { EquipmentIndividualTagPageView } from '@/views/equipment-views/equipment-individual-tag-page-view'
import { TagPageView } from '@/views/tag-page-view/tag-page-view'
import { ToolsIndividualTagPageView } from '@/views/tools-views/tools-individual-tag-page-view'
import { notFound } from 'next/navigation'

type CompendiumEntity = ItemDesc | CargoDesc | ResourceDesc

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
  const cargoData = camelCaseDeep<CargoDesc[]>(cargoDescData)
  const resourceData = camelCaseDeep<ResourceDesc[]>(resourceDescData)

  // Filter entries by tag
  const items = itemData.filter((item) => item.compendiumEntry && item.tag === tagName)
  const cargo = cargoData.filter((cargo) => cargo.tag === tagName)
  const resources = resourceData.filter((resource) => resource.compendiumEntry && resource.tag === tagName)

  // Combine all entities
  const allEntities: CompendiumEntity[] = [...items, ...cargo, ...resources]

  // If no entities found, return 404
  if (allEntities.length === 0) {
    notFound()
  }

  // Determine entity type
  const entityType = items.length > 0 ? 'Items' : cargo.length > 0 ? 'Cargo' : 'Resources'

  // Check if this tag is an equipment tag
  const isEquipmentTag = tagCollections.equipment.tags.some((tag) => tag === tagName)

  // Check if this tag is a tools tag
  const isToolsTag = tagCollections.tools.tags.some((tag) => tag === tagName)

  // Check if this tag is a collectibles tag
  const isCollectiblesTag = tagCollections.collectibles.tags.some((tag) => tag === tagName)

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

  // Handle non-equipment/tools tags (regular items, cargo, resources)
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
