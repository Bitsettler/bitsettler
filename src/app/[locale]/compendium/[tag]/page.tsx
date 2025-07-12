import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import cargoDescData from '@/data/global/cargo_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import resourceDescData from '@/data/global/resource_desc.json'
import { tagCollections, findTagCollection } from '@/lib/spacetime-db/items/tag-collections'
import { getEquipmentWithStats, formatStatName } from '@/lib/spacetime-db/items/equipments'
import { getToolsWithDetails } from '@/lib/spacetime-db/items/tools'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import { TagPageView } from '@/views/tag-page-view/tag-page-view'
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
  const isEquipmentTag = tagCollections.equipment.tags.some(tag => tag === tagName)
  
  // Check if this tag is a tools tag
  const isToolsTag = tagCollections.tools.tags.some(tag => tag === tagName)
  
  // Find which collection this tag belongs to for smart navigation
  const parentCollection = findTagCollection(tagName)

  let itemGroups
  let statisticsCards

  if (isEquipmentTag && items.length > 0) {
    // Handle equipment tags with slot organization
    const equipmentWithStats = getEquipmentWithStats()
    const equipmentForThisTag = equipmentWithStats.filter(equipment => equipment.item.tag === tagName)
    
    // Group by slot
    const equipmentBySlot: Record<string, typeof equipmentForThisTag> = {}
    equipmentForThisTag.forEach(equipment => {
      equipment.slotNames.forEach(slotName => {
        if (!equipmentBySlot[slotName]) {
          equipmentBySlot[slotName] = []
        }
        equipmentBySlot[slotName].push(equipment)
      })
    })

    // Create item groups for each slot
    itemGroups = Object.entries(equipmentBySlot).map(([slotName, equipmentItems]) => {
      // Deduplicate by tier (keep only one equipment per tier)
      const deduplicatedEquipment = equipmentItems.reduce((acc, equipment) => {
        const key = `${equipment.item.name}_T${equipment.item.tier}`
        if (!acc[key]) {
          acc[key] = equipment
        }
        return acc
      }, {} as Record<string, typeof equipmentItems[0]>)

      const equipmentList = Object.values(deduplicatedEquipment)

      // Get all unique stats from this equipment group for columns
      const allStats = new Set<string>()
      equipmentList.forEach(equipment => {
        equipment.decodedStats.forEach(stat => {
          allStats.add(stat.name)
        })
      })

      // Create base columns (no rarity for equipment since we deduplicate by tier)
      const baseColumns = [
        { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' }
      ]

      // Add stat columns without render functions
      const statColumns = Array.from(allStats).sort().map(statName => ({
        key: `stat_${statName}`,
        label: formatStatName(statName),
        sortable: true,
        className: 'text-center'
      }))

      // Create enriched items with stats as properties
      const enrichedItems = equipmentList.map(equipment => ({
        ...equipment.item,
        // Add stats as properties with stat_ prefix
        ...Object.fromEntries(
          equipment.decodedStats.map(stat => [`stat_${stat.name}`, stat.displayValue])
        )
      }))

      return {
        name: slotName.replace(/([A-Z])/g, ' $1').trim(),
        items: enrichedItems,
        columns: [...baseColumns, ...statColumns]
      }
    })

    // Equipment statistics
    const totalEquipment = equipmentForThisTag.length
    const slotCount = Object.keys(equipmentBySlot).length
    const tierDistribution: Record<number, number> = {}
    equipmentForThisTag.forEach(equipment => {
      tierDistribution[equipment.item.tier] = (tierDistribution[equipment.item.tier] || 0) + 1
    })

    statisticsCards = [
      {
        label: 'Total Equipment',
        value: totalEquipment
      },
      {
        label: 'Equipment Slots',
        value: slotCount
      },
      {
        label: 'Tier Range',
        value: Object.keys(tierDistribution).length
      },
      {
        label: 'Min - Max Tier',
        value: `T${Math.min(...Object.keys(tierDistribution).map(Number))} - T${Math.max(...Object.keys(tierDistribution).map(Number))}`
      }
    ]
  } else if (isToolsTag && items.length > 0) {
    // Handle tools tags with enriched data
    const toolsWithDetails = getToolsWithDetails()
    const toolsForThisTag = toolsWithDetails.filter(tool => tool.item.tag === tagName)
    
    // Deduplicate by tier (keep only one tool per tier)
    const deduplicatedTools = toolsForThisTag.reduce((acc, tool) => {
      const key = `${tool.item.name}_T${tool.item.tier}`
      if (!acc[key]) {
        acc[key] = tool
      }
      return acc
    }, {} as Record<string, typeof toolsForThisTag[0]>)

    const toolsList = Object.values(deduplicatedTools)
    
    // Create single group for all tools
    itemGroups = [{
      name: tagName,
      items: toolsList.map(tool => ({
        ...tool.item,
        // Add tool stats as properties
        level: tool.level,
        power: tool.power,
        toolType: tool.toolTypeName
      })),
      columns: [
        { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
        { key: 'level', label: 'Level', sortable: true, className: 'text-center' },
        { key: 'power', label: 'Power', sortable: true, className: 'text-center' },
        { key: 'toolType', label: 'Type', sortable: true, className: 'text-center' }
      ]
    }]

    // Tools statistics
    const totalTools = toolsForThisTag.length
    const levelDistribution: Record<number, number> = {}
    toolsForThisTag.forEach(tool => {
      levelDistribution[tool.level] = (levelDistribution[tool.level] || 0) + 1
    })

    const powerRange = toolsForThisTag.length > 0 ? {
      min: Math.min(...toolsForThisTag.map(t => t.power)),
      max: Math.max(...toolsForThisTag.map(t => t.power))
    } : { min: 0, max: 0 }

    statisticsCards = [
      {
        label: 'Total Tools',
        value: totalTools
      },
      {
        label: 'Level Range',
        value: Object.keys(levelDistribution).length > 0 
          ? `${Math.min(...Object.keys(levelDistribution).map(Number))} - ${Math.max(...Object.keys(levelDistribution).map(Number))}`
          : '0'
      },
      {
        label: 'Power Range',
        value: totalTools > 0 ? `${powerRange.min} - ${powerRange.max}` : '0'
      },
      {
        label: 'Tool Type',
        value: toolsForThisTag[0]?.toolTypeName || 'Unknown'
      }
    ]
  } else {
    // Handle non-equipment tags (regular items, cargo, resources)
    itemGroups = [
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

    // Regular statistics cards
    statisticsCards = [
      {
        label: `Total ${entityType}`,
        value: allEntities.length
      },
      {
        label: 'Category',
        value: tagName
      },
      {
        label: 'Type',
        value: entityType
      }
    ]
  }

  return (
    <TagPageView
      title={tagName}
      subtitle={`${allEntities.length} ${entityType.toLowerCase()} in this category`}
      backLink={parentCollection?.href || '/compendium'}
      backLinkText={parentCollection ? `← Back to ${parentCollection.name}` : '← Back to Compendium'}
      statisticsCards={statisticsCards}
      itemGroups={itemGroups}
    />
  )
}
