import type { ToolDesc } from '@/data/bindings/tool_desc_type'
import toolDescData from '@/data/global/tool_desc.json'
import { camelCaseDeep } from '../../../shared/utils/case-utils'

/**
 * Get all tool descriptions
 */
export function getAllTools(): ToolDesc[] {
  return camelCaseDeep<ToolDesc[]>(toolDescData)
}
