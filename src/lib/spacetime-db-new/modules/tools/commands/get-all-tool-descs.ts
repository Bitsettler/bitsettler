import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import toolDescData from '@/data/sdk-tables/tool_desc.json'

// SDK data is already in camelCase format, no transformation needed
const toolDescs = toolDescData as ToolDesc[]

/**
 * Get all tool descriptions from SDK data
 */
export function getAllToolDescs(): ToolDesc[] {
  return toolDescs
}
