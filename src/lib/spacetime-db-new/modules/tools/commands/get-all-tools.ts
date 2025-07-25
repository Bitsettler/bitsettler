import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import itemDescData from '@/data/sdk-tables/item_desc.json'
import toolDescData from '@/data/sdk-tables/tool_desc.json'

// SDK data is already in camelCase format, no transformation needed
const items = itemDescData as ItemDesc[]
const tools = toolDescData as ToolDesc[]

/**
 * Get all tool items from SDK data (items that have corresponding tool descriptions)
 */
export function getAllTools(): ItemDesc[] {
  return tools
    .map((toolDesc) => {
      return items.find((item) => item.id === toolDesc.itemId)
    })
    .filter((item): item is ItemDesc => item !== undefined && item.compendiumEntry)
}
