import type { ItemDesc } from '@/data/bindings/item_desc_type'
import { getAllItems } from '../../items/commands/get-all-items'
import { getAllToolDescs } from './get-all-tool-descs'

/**
 * Get a tool item by tool type and level
 */
export function getToolByTypeAndLevel(
  toolType: number,
  level: number
): ItemDesc | undefined {
  const toolDescs = getAllToolDescs()
  const allItems = getAllItems()

  // Find tool with matching type and level
  const toolDesc = toolDescs.find(
    (tool) => tool.toolType === toolType && tool.level === level
  )

  if (!toolDesc) {
    return undefined
  }

  // Find the corresponding item
  return allItems.find((item) => item.id === toolDesc.itemId)
}
