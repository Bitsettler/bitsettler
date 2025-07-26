import type { EquipmentWithStats } from '@/lib/spacetime-db-new/modules/equipment/flows'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getLowestRarity } from '@/lib/spacetime-db-new/shared/utils/rarity'
import { camelCaseToSpaces } from '@/lib/utils'
import { TagPageView } from '@/views/tag-views/tag-page-view'

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
    // Get the lowest available rarity for this slot, then filter by that rarity and volume > 0
    const lowestRarity = getLowestRarity(equipmentItems)
    const filteredEquipment = equipmentItems.filter(
      (equipment) => 
        equipment.item.rarity.tag === lowestRarity && 
        equipment.item.volume > 0
    )
    
    // Deduplicate by name+tier (keep only one equipment per name+tier combination)
    const deduplicatedEquipment = filteredEquipment.reduce(
      (acc, equipment) => {
        const key = `${equipment.item.name}_T${equipment.item.tier}`
        if (!acc[key]) {
          acc[key] = equipment
        }
        return acc
      },
      {} as Record<string, (typeof filteredEquipment)[0]>
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
      { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
      { key: 'levelRequirement', label: 'Level Req.', sortable: true, className: 'text-center' }
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
      // Add level requirement
      levelRequirement: equipment.equipmentData.levelRequirement?.level || 1,
      // Add stats as properties with stat_ prefix
      ...Object.fromEntries(
        equipment.equipmentData.stats.map((stat) => {
          const roundedValue = Math.round(stat.value * 100) / 100
          const displayValue = stat.value < 1 ? `${(roundedValue * 100).toFixed(2)}%` : roundedValue.toString()
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
  const tagSlug = createSlug(tagName)

  return (
    <TagPageView
      title={tagName}
      subtitle={`${totalEquipment} equipment items in this category`}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
      enableItemLinks={true}
      tagSlug={tagSlug}
    />
  )
}
