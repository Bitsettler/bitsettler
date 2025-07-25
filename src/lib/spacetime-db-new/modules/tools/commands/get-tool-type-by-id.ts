import { getAllToolTypes } from './get-all-tool-types'

/**
 * Get tool type by ID
 */
export function getToolTypeById(id: number) {
  const toolTypes = getAllToolTypes()
  return toolTypes.find((type) => type.id === id)
}
