import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import { getAllTools } from './get-all-tools'

/**
 * Get tool description by ID
 */
export function getToolById(id: number): ToolDesc | undefined {
  const tools = getAllTools()
  return tools.find((tool) => tool.id === id)
}
