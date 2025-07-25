import type { ToolTypeDesc } from '@/data/bindings/tool_type_desc_type'
import toolTypeDescData from '@/data/sdk-tables/tool_type_desc.json'

// SDK data is already in camelCase format, no transformation needed
const toolTypes = toolTypeDescData as ToolTypeDesc[]

/**
 * Get all tool types from SDK data
 */
export function getAllToolTypes(): ToolTypeDesc[] {
  return toolTypes
}
