import type { SkillDesc } from '@/data/bindings/skill_desc_type'
import { getAllSkills } from './get-all-skills'

/**
 * Get skills filtered by skill categories
 */
export function getSkillsByCategories(categories: string[]): SkillDesc[] {
  const allSkills = getAllSkills()
  return allSkills.filter(skill => 
    skill.skillCategory && categories.includes(skill.skillCategory.tag)
  )
}