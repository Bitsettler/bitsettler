import { getAllTools, getAllToolTypes } from '../commands'

export interface ToolStatistics {
  total: number
  types: number
}

/**
 * Get comprehensive statistics about tools
 */
export function getToolStatistics(): ToolStatistics {
  const tools = getAllTools()
  const toolTypes = getAllToolTypes()

  return {
    total: tools.length,
    types: toolTypes.length
  }
}
