import { formatStatName, getEquipmentWithStats } from '@/lib/spacetime-db/items/equipments'
import { TagPageView } from '@/views/tag-page-view/tag-page-view'

interface EquipmentIndividualTagPageViewProps {
  tagName: string
  backLink?: string
  backLinkText?: string
}

export function EquipmentIndividualTagPageView({
  tagName,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: EquipmentIndividualTagPageViewProps) {
  // Handle equipment tags with slot organization
  const equipmentWithStats = getEquipmentWithStats()
  const equipmentForThisTag = equipmentWithStats.filter((equipment) => equipment.item.tag === tagName)

  // Group by slot
  const equipmentBySlot: Record<string, typeof equipmentForThisTag> = {}
  equipmentForThisTag.forEach((equipment) => {
    equipment.slotNames.forEach((slotName) => {
      if (!equipmentBySlot[slotName]) {
        equipmentBySlot[slotName] = []
      }
      equipmentBySlot[slotName].push(equipment)
    })
  })

  // Create item groups for each slot
  const itemGroups = Object.entries(equipmentBySlot).map(([slotName, equipmentItems]) => {
    // Deduplicate by tier (keep only one equipment per tier)
    const deduplicatedEquipment = equipmentItems.reduce(
      (acc, equipment) => {
        const key = `${equipment.item.name}_T${equipment.item.tier}`
        if (!acc[key]) {
          acc[key] = equipment
        }
        return acc
      },
      {} as Record<string, (typeof equipmentItems)[0]>
    )

    const equipmentList = Object.values(deduplicatedEquipment)

    // Get all unique stats from this equipment group for columns
    const allStats = new Set<string>()
    equipmentList.forEach((equipment) => {
      equipment.decodedStats.forEach((stat) => {
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
    const statColumns = Array.from(allStats)
      .sort()
      .map((statName) => ({
        key: `stat_${statName}`,
        label: formatStatName(statName),
        sortable: true,
        className: 'text-center'
      }))

    // Create enriched items with stats as properties
    const enrichedItems = equipmentList.map((equipment) => ({
      ...equipment.item,
      // Add stats as properties with stat_ prefix
      ...Object.fromEntries(equipment.decodedStats.map((stat) => [`stat_${stat.name}`, stat.displayValue]))
    }))

    return {
      name: slotName.replace(/([A-Z])/g, ' $1').trim(),
      items: enrichedItems,
      columns: [...baseColumns, ...statColumns]
    }
  })

  // Equipment statistics
  const totalEquipment = equipmentForThisTag.length
  const tierDistribution: Record<number, number> = {}
  equipmentForThisTag.forEach((equipment) => {
    tierDistribution[equipment.item.tier] = (tierDistribution[equipment.item.tier] || 0) + 1
  })

  return (
    <TagPageView
      title={tagName}
      subtitle={`${totalEquipment} equipment items in this category`}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
    />
  )
}
