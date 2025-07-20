import type { KnowledgeScrollDesc } from '@/data/bindings/knowledge_scroll_desc_type'
import { getAllKnowledgeScrolls } from './get-all-knowledge-scrolls'

/**
 * Get knowledge scroll description by item ID
 */
export function getKnowledgeScrollById(itemId: number): KnowledgeScrollDesc | undefined {
  const knowledgeScrolls = getAllKnowledgeScrolls()
  return knowledgeScrolls.find((scroll) => scroll.itemId === itemId)
}
