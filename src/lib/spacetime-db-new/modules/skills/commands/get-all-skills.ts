import type { SkillDesc } from '@/data/bindings/skill_desc_type'
import skillDescData from '@/data/sdk-tables/skill_desc.json'

// SDK data is already in camelCase format, no transformation needed
const skills = skillDescData as SkillDesc[]

/**
 * Get all skills from SDK data
 */
export function getAllSkills(): SkillDesc[] {
  return skills
}
