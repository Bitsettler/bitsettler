import type { KnowledgeScrollDesc } from '@/data/bindings/knowledge_scroll_desc_type'
import knowledgeScrollDescData from '@/data/global/knowledge_scroll_desc.json'
import { camelCaseDeep } from '../../../shared/utils/case-utils'

/**
 * Get all knowledge scroll descriptions
 */
export function getAllKnowledgeScrolls(): KnowledgeScrollDesc[] {
  return camelCaseDeep<KnowledgeScrollDesc[]>(knowledgeScrollDescData)
}
