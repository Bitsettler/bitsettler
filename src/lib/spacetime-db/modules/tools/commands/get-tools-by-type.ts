import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import { getAllTools } from './get-all-tools'

/**
 * Get tool descriptions by type
 */
export function getToolsByType(toolType: number): ToolDesc[] {
  const tools = getAllTools()
  return tools.filter((tool) => tool.toolType === toolType)
}

/**
 * Get the first tool description by type (for getting a representative tool)
 */
export function getToolByType(toolType: number): ToolDesc | undefined {
  const tools = getToolsByType(toolType)
  return tools[0]
}
