import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { EquipmentDesc } from '@/data/bindings/equipment_desc_type'
import itemDescData from '@/data/global/item_desc.json'
import equipmentDescData from '@/data/global/equipment_desc.json'
import { camelCaseDeep } from '@/lib/utils/case-utils'

// Raw equipment data interface from JSON
interface RawEquipmentData {
  item_id: number
  slots: [number, unknown][]
  visual_type: [number, unknown]
  level_requirement: [number, unknown]
  clothing_visual: [number, unknown]
  hand_equipment_visual: [number, unknown]
  stats: [unknown, number, boolean][]
  required_achievements: number[]
  required_knowledges: number[]
}

// Combined equipment data with item information
export interface EquipmentWithItem extends EquipmentDesc {
  item: ItemDesc
  slotNames: string[]
  decodedStats: { name: string; value: number; isPct: boolean; displayValue: string }[]
}

// Mapping of slot type indices to slot names based on the algebraic type definition
const SLOT_TYPE_NAMES = [
  'MainHand',      // 0
  'OffHand',       // 1
  'HeadArtifact',  // 2
  'TorsoArtifact', // 3
  'HandArtifact',  // 4
  'FeetArtifact',  // 5
  'HeadClothing',  // 6
  'TorsoClothing', // 7
  'HandClothing',  // 8
  'BeltClothing',  // 9
  'LegClothing',   // 10
  'FeetClothing',  // 11
  'None'           // 12
]

// Mapping of character stat type indices to stat names
const CHARACTER_STAT_NAMES = [
  'MaxHealth',                     // 0
  'MaxStamina',                    // 1
  'PassiveHealthRegenRate',        // 2
  'PassiveStaminaRegenRate',       // 3
  'MovementMultiplier',            // 4
  'SprintMultiplier',              // 5
  'SprintStaminaDrain',            // 6
  'Armor',                         // 7
  'CooldownMultiplier',            // 8
  'HuntingWeaponPower',            // 9
  'Strength',                      // 10
  'ColdProtection',                // 11
  'HeatProtection',                // 12
  'Evasion',                       // 13
  'ToolbeltSlots',                 // 14
  'CraftingSpeed',                 // 15
  'GatheringSpeed',                // 16
  'BuildingSpeed',                 // 17
  'SatiationRegenRate',            // 18
  'MaxSatiation',                  // 19
  'DefenseLevel',                  // 20
  'ForestrySpeed',                 // 21
  'CarpentrySpeed',                // 22
  'MasonrySpeed',                  // 23
  'MiningSpeed',                   // 24
  'SmithingSpeed',                 // 25
  'ScholarSpeed',                  // 26
  'LeatherworkingSpeed',           // 27
  'HuntingSpeed',                  // 28
  'TailoringSpeed',                // 29
  'FarmingSpeed',                  // 30
  'FishingSpeed',                  // 31
  'CookingSpeed',                  // 32
  'ForagingSpeed',                 // 33
  'ForestryPower',                 // 34
  'CarpentryPower',                // 35
  'MasonryPower',                  // 36
  'MiningPower',                   // 37
  'SmithingPower',                 // 38
  'ScholarPower',                  // 39
  'LeatherworkingPower',           // 40
  'HuntingPower',                  // 41
  'TailoringPower',                // 42
  'FarmingPower',                  // 43
  'FishingPower',                  // 44
  'CookingPower',                  // 45
  'ForagingPower',                 // 46
  'ActiveHealthRegenRate',         // 47
  'ActiveStaminaRegenRate',        // 48
  'ClimbProficiency',              // 49
  'ExperienceRate',                // 50
  'Accuracy',                      // 51
  'MaxTeleportationEnergy',        // 52
  'TeleportationEnergyRegenRate'   // 53
]

/**
 * Get all equipment items from item_desc.json by matching equipment_desc item_ids
 */
export function getEquipmentItems(): ItemDesc[] {
  const itemData = camelCaseDeep<ItemDesc[]>(itemDescData)
  const equipmentStats = getEquipmentStats()
  const equipmentItemIds = new Set(equipmentStats.map(stat => stat.itemId))
  
  return itemData.filter((item) => 
    item.compendiumEntry && equipmentItemIds.has(item.id)
  )
}

/**
 * Get all equipment stats from equipment_desc.json
 */
export function getEquipmentStats(): EquipmentDesc[] {
  return camelCaseDeep<EquipmentDesc[]>(equipmentDescData as unknown as RawEquipmentData[])
}

/**
 * Get slot name from algebraic type index
 */
export function getSlotTypeName(slotIndex: number): string {
  return SLOT_TYPE_NAMES[slotIndex] || 'Unknown'
}

/**
 * Decode slots from raw equipment data
 */
export function decodeEquipmentSlots(rawSlots: [number, unknown][]): string[] {
  return rawSlots.map(([slotIndex]) => getSlotTypeName(slotIndex))
}

/**
 * Get character stat name from algebraic type index
 */
export function getCharacterStatName(statIndex: number): string {
  return CHARACTER_STAT_NAMES[statIndex] || 'Unknown'
}

/**
 * Decode equipment stats from raw JSON format
 */
export function decodeEquipmentStats(rawStats: [unknown, number, boolean][]): { name: string; value: number; isPct: boolean; displayValue: string }[] {
  return rawStats.map(([statType, value, isPct]) => {
    // Extract stat index from algebraic type format [index, data]
    const statIndex = Array.isArray(statType) ? statType[0] : statType
    const statName = getCharacterStatName(statIndex as number)
    
    // Format display value - multiply by 100 for percentage values
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
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Get equipment slots excluding weapons (MainHand, OffHand)
 */
export function getNonWeaponSlots(): string[] {
  const equipment = getEquipmentWithStats()
  const allSlots = new Set<string>()
  
  // Collect all unique slot types from actual equipment, excluding weapons
  equipment.forEach(item => {
    item.slotNames.forEach(slot => {
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
    'HeadClothing': { icon: '👒', description: 'Headwear and head accessories', category: 'Clothing' },
    'TorsoClothing': { icon: '👕', description: 'Shirts, robes, and torso wear', category: 'Clothing' },
    'HandClothing': { icon: '🧤', description: 'Gloves and hand accessories', category: 'Clothing' },
    'BeltClothing': { icon: '🔗', description: 'Belts and waist accessories', category: 'Clothing' },
    'LegClothing': { icon: '👖', description: 'Pants, skirts, and leg wear', category: 'Clothing' },
    'FeetClothing': { icon: '👟', description: 'Shoes, boots, and footwear', category: 'Clothing' },
    'HeadArtifact': { icon: '💎', description: 'Magical head artifacts', category: 'Artifacts' },
    'TorsoArtifact': { icon: '✨', description: 'Magical torso artifacts', category: 'Artifacts' },
    'HandArtifact': { icon: '💍', description: 'Rings and hand artifacts', category: 'Artifacts' },
    'FeetArtifact': { icon: '👢', description: 'Magical footwear artifacts', category: 'Artifacts' }
  }
  
  return slotInfo[slotName] || { icon: '📦', description: 'Equipment slot', category: 'Other' }
}

/**
 * Combine equipment items with their stats and slot information
 */
export function getEquipmentWithStats(): EquipmentWithItem[] {
  const equipmentItems = getEquipmentItems()
  const rawEquipmentData = equipmentDescData as unknown as RawEquipmentData[]
  
  const results: EquipmentWithItem[] = []
  
  for (const item of equipmentItems) {
    const rawData = rawEquipmentData.find((data) => data.item_id === item.id)
    if (rawData) {
      // Decode slots from algebraic format [index, data]
      const slotNames = decodeEquipmentSlots(rawData.slots)
      
      // Decode stats from algebraic format
      const decodedStats = decodeEquipmentStats(rawData.stats)
      
      // Convert to camelCase for consistency
      const stats = camelCaseDeep(rawData) as EquipmentDesc
      
      results.push({
        ...stats,
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
export function getEquipmentGroupedBySlot(): Record<string, EquipmentWithItem[]> {
  const equipment = getEquipmentWithStats()
  
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
export function getEquipmentStatistics() {
  const nonWeaponSlots = getNonWeaponSlots()
  const equipmentBySlot = getEquipmentGroupedBySlot()
  
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