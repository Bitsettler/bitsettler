import type { EquipmentDesc } from '@/data/bindings/equipment_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { EquipmentSlotType } from '@/data/bindings/equipment_slot_type_type'
import type { CharacterStatType } from '@/data/bindings/character_stat_type_type'
import equipmentDescData from '@/data/global/equipment_desc.json'
import itemDescData from '@/data/global/item_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Combined equipment data with item information
export interface EquipmentWithItem extends EquipmentDesc {
  item: ItemDesc
  slotNames: string[]
  decodedStats: { name: string; value: number; isPct: boolean; displayValue: string }[]
}

// Alias for consistency with other view components
export type EquipmentWithStats = EquipmentWithItem

// Mapping of slot type indices to slot names based on the algebraic type definition
const SLOT_TYPE_NAMES = [
  'MainHand', // 0
  'OffHand', // 1
  'HeadArtifact', // 2
  'TorsoArtifact', // 3
  'HandArtifact', // 4
  'FeetArtifact', // 5
  'HeadClothing', // 6
  'TorsoClothing', // 7
  'HandClothing', // 8
  'BeltClothing', // 9
  'LegClothing', // 10
  'FeetClothing', // 11
  'None' // 12
]

// Mapping of character stat type indices to stat names
const CHARACTER_STAT_NAMES = [
  'MaxHealth', // 0
  'MaxStamina', // 1
  'PassiveHealthRegenRate', // 2
  'PassiveStaminaRegenRate', // 3
  'MovementMultiplier', // 4
  'SprintMultiplier', // 5
  'SprintStaminaDrain', // 6
  'Armor', // 7
  'CooldownMultiplier', // 8
  'HuntingWeaponPower', // 9
  'Strength', // 10
  'ColdProtection', // 11
  'HeatProtection', // 12
  'Evasion', // 13
  'ToolbeltSlots', // 14
  'CraftingSpeed', // 15
  'GatheringSpeed', // 16
  'BuildingSpeed', // 17
  'SatiationRegenRate', // 18
  'MaxSatiation', // 19
  'DefenseLevel', // 20
  'ForestrySpeed', // 21
  'CarpentrySpeed', // 22
  'MasonrySpeed', // 23
  'MiningSpeed', // 24
  'SmithingSpeed', // 25
  'ScholarSpeed', // 26
  'LeatherworkingSpeed', // 27
  'HuntingSpeed', // 28
  'TailoringSpeed', // 29
  'FarmingSpeed', // 30
  'FishingSpeed', // 31
  'CookingSpeed', // 32
  'ForagingSpeed', // 33
  'ForestryPower', // 34
  'CarpentryPower', // 35
  'MasonryPower', // 36
  'MiningPower', // 37
  'SmithingPower', // 38
  'ScholarPower', // 39
  'LeatherworkingPower', // 40
  'HuntingPower', // 41
  'TailoringPower', // 42
  'FarmingPower', // 43
  'FishingPower', // 44
  'CookingPower', // 45
  'ForagingPower', // 46
  'ActiveHealthRegenRate', // 47
  'ActiveStaminaRegenRate', // 48
  'ClimbProficiency', // 49
  'ExperienceRate', // 50
  'Accuracy', // 51
  'MaxTeleportationEnergy', // 52
  'TeleportationEnergyRegenRate' // 53
]

/**
 * Get equipment-related data from static JSON files
 */
function getEquipmentData() {
  return {
    itemDesc: camelCaseDeep<ItemDesc[]>(itemDescData),
    equipmentDesc: camelCaseDeep<EquipmentDesc[]>(equipmentDescData)
  }
}

/**
 * Get all equipment items from live data by matching equipment_desc item_ids
 */
export async function getEquipmentItems(): Promise<ItemDesc[]> {
  const { itemDesc, equipmentDesc } = getEquipmentData()
  const equipmentItemIds = new Set(equipmentDesc.map((stat) => stat.itemId))

  return itemDesc.filter((item) => item.compendiumEntry && equipmentItemIds.has(item.id))
}

/**
 * Get all equipment stats from live data
 */
export async function getEquipmentStats(): Promise<EquipmentDesc[]> {
  const { equipmentDesc } = getEquipmentData()
  return equipmentDesc
}

/**
 * Get slot name from algebraic type index
 */
export function getSlotTypeName(slotIndex: number): string {
  return SLOT_TYPE_NAMES[slotIndex] || 'Unknown'
}

/**
 * Decode slots from equipment slot types
 */
export function decodeEquipmentSlots(slots: unknown[]): string[] {
  return slots.map((slot) => {
    // Handle both the proper typed format and the raw JSON format
    if (typeof slot === 'object' && slot && 'tag' in slot) {
      return (slot as EquipmentSlotType).tag
    } else if (Array.isArray(slot) && slot.length > 0) {
      // Array format from JSON: [index, data]
      const slotIndex = slot[0] as number
      return getSlotTypeName(slotIndex)
    } else {
      return 'Unknown'
    }
  })
}

/**
 * Get character stat name from algebraic type index
 */
export function getCharacterStatName(statIndex: number): string {
  return CHARACTER_STAT_NAMES[statIndex] || 'Unknown'
}

/**
 * Decode equipment stats from CSV stat entries
 */
export function decodeEquipmentStats(
  stats: unknown[]
): { name: string; value: number; isPct: boolean; displayValue: string }[] {
  return stats.map((stat: unknown) => {
    // Type guard to ensure stat is an object with expected properties
    if (typeof stat !== 'object' || stat === null) {
      return { name: 'Unknown', value: 0, isPct: false, displayValue: '0' }
    }
    
    const statObj = stat as Record<string, unknown>
    
    // Handle both the proper typed format and the raw JSON format
    let statName: string
    if (typeof statObj.id === 'object' && statObj.id && 'tag' in statObj.id) {
      // Proper typed format
      statName = formatStatName((statObj.id as CharacterStatType).tag)
    } else if (Array.isArray(statObj.id) && statObj.id.length > 0) {
      // Array format from JSON: [index, data]
      const statIndex = statObj.id[0] as number
      statName = getCharacterStatName(statIndex)
    } else {
      // Fallback for unknown format
      statName = 'Unknown'
    }

    // Format display value - multiply by 100 for percentage values
    const value = typeof statObj.value === 'number' ? statObj.value : 0
    const isPct = typeof statObj.isPct === 'boolean' ? statObj.isPct : false
    const displayValue = isPct ? `${(value * 100).toFixed(1)}%` : value.toString()

    return {
      name: statName,
      value,
      isPct,
      displayValue
    }
  })
}

/**
 * Format stat name for display
 */
export function formatStatName(statName: string): string {
  // Convert CamelCase to readable format
  return statName
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Get equipment slots excluding weapons (MainHand, OffHand)
 */
export async function getNonWeaponSlots(): Promise<string[]> {
  const equipment = await getEquipmentWithStats()
  const allSlots = new Set<string>()

  // Collect all unique slot types from actual equipment, excluding weapons
  equipment.forEach((item) => {
    item.slotNames.forEach((slot) => {
      if (slot !== 'MainHand' && slot !== 'OffHand' && slot !== 'None') {
        allSlots.add(slot)
      }
    })
  })

  return Array.from(allSlots).sort()
}

/**
 * Get slot display information
 */
export function getSlotDisplayInfo(slotName: string): { icon: string; description: string; category: string } {
  const slotInfo: Record<string, { icon: string; description: string; category: string }> = {
    HeadClothing: { icon: '👒', description: 'Headwear and head accessories', category: 'Clothing' },
    TorsoClothing: { icon: '👕', description: 'Shirts, robes, and torso wear', category: 'Clothing' },
    HandClothing: { icon: '🧤', description: 'Gloves and hand accessories', category: 'Clothing' },
    BeltClothing: { icon: '🔗', description: 'Belts and waist accessories', category: 'Clothing' },
    LegClothing: { icon: '👖', description: 'Pants, skirts, and leg wear', category: 'Clothing' },
    FeetClothing: { icon: '👟', description: 'Shoes, boots, and footwear', category: 'Clothing' },
    HeadArtifact: { icon: '💎', description: 'Magical head artifacts', category: 'Artifacts' },
    TorsoArtifact: { icon: '✨', description: 'Magical torso artifacts', category: 'Artifacts' },
    HandArtifact: { icon: '💍', description: 'Rings and hand artifacts', category: 'Artifacts' },
    FeetArtifact: { icon: '👢', description: 'Magical footwear artifacts', category: 'Artifacts' }
  }

  return slotInfo[slotName] || { icon: '📦', description: 'Equipment slot', category: 'Other' }
}

/**
 * Combine equipment items with their stats and slot information
 */
export async function getEquipmentWithStats(): Promise<EquipmentWithItem[]> {
  const { itemDesc, equipmentDesc } = getEquipmentData()

  const equipmentItems = itemDesc.filter((item) => {
    const equipmentItemIds = new Set(equipmentDesc.map((stat) => stat.itemId))
    return item.compendiumEntry && equipmentItemIds.has(item.id)
  })

  const results: EquipmentWithItem[] = []

  for (const item of equipmentItems) {
    const equipData = equipmentDesc.find((data) => data.itemId === item.id)
    if (equipData) {
      // Decode slots - handle both typed and raw JSON formats
      const slotNames = decodeEquipmentSlots(equipData.slots as unknown[])

      // Decode stats - handle both typed and raw JSON formats  
      const decodedStats = decodeEquipmentStats(equipData.stats as unknown[])

      results.push({
        ...equipData,
        item,
        slotNames,
        decodedStats
      })
    }
  }

  return results
}

/**
 * Get equipment grouped by equipment slot type, sorted by tier
 */
export async function getEquipmentGroupedBySlot(): Promise<Record<string, EquipmentWithItem[]>> {
  const equipment = await getEquipmentWithStats()

  const grouped: Record<string, EquipmentWithItem[]> = {}

  for (const item of equipment) {
    for (const slotName of item.slotNames) {
      if (!grouped[slotName]) {
        grouped[slotName] = []
      }
      grouped[slotName].push(item)
    }
  }

  // Sort each group by item name
  for (const slotType in grouped) {
    grouped[slotType].sort((a, b) => a.item.name.localeCompare(b.item.name))
  }

  return grouped
}

/**
 * Get equipment statistics overview
 */
export async function getEquipmentStatistics() {
  const nonWeaponSlots = await getNonWeaponSlots()
  const equipmentBySlot = await getEquipmentGroupedBySlot()

  const totalEquipment = nonWeaponSlots.reduce((total, slot) => {
    return total + (equipmentBySlot[slot]?.length || 0)
  }, 0)

  return {
    total: totalEquipment,
    slots: nonWeaponSlots.length,
    equipmentBySlot: Object.entries(equipmentBySlot)
      .filter(([slot]) => nonWeaponSlots.includes(slot))
      .map(([slot, items]) => ({
        slot,
        count: items.length
      }))
  }
}
