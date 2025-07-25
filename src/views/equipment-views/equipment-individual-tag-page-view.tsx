import type { EquipmentWithStats } from '@/lib/spacetime-db-new/modules/equipment/flows'
import { TagPageView } from '@/views/tag-views/tag-page-view'
import { camelCaseToSpaces } from '@/lib/utils'

interface EquipmentIndividualTagPageViewProps {
  tagName: string
  equipment: EquipmentWithStats[]
  backLink?: string
  backLinkText?: string
}

export function EquipmentIndividualTagPageView({
  tagName,
  equipment,
  backLink = '/compendium',
  backLinkText = '← Back to Compendium'
}: EquipmentIndividualTagPageViewProps) {
  // Group by slot using equipment data
  const equipmentBySlot: Record<string, EquipmentWithStats[]> = {}
  equipment.forEach((item) => {
    item.equipmentData.slots.forEach((slot) => {
      const slotName = slot.tag
      if (!equipmentBySlot[slotName]) {
        equipmentBySlot[slotName] = []
      }
      equipmentBySlot[slotName].push(item)
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
      equipment.equipmentData.stats.forEach((stat) => {
        allStats.add(stat.id.tag)
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
        label: camelCaseToSpaces(statName),
        sortable: true,
        className: 'text-center'
      }))

    // Create enriched items with stats as properties
    const enrichedItems = equipmentList.map((equipment) => ({
      ...equipment.item,
      // Add stats as properties with stat_ prefix
      ...Object.fromEntries(
        equipment.equipmentData.stats.map((stat) => {
          const displayValue = stat.isPct ? `${stat.value}%` : stat.value.toString()
          return [`stat_${stat.id.tag}`, displayValue]
        })
      )
    }))

    return {
      name: camelCaseToSpaces(slotName),
      items: enrichedItems,
      columns: [...baseColumns, ...statColumns]
    }
  })

  // Equipment statistics
  const totalEquipment = equipment.length

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
