import { getAllToolDescs } from './get-all-tool-descs'

/**
 * Get tool description by item ID
 */
export function getToolDescByItemId(itemId: number) {
  const toolDescs = getAllToolDescs()
  return toolDescs.find((desc) => desc.itemId === itemId)
}
