import { getAllSkills } from './get-all-skills'

/**
 * Get skill by ID
 */
export function getSkillById(id: number) {
  const skills = getAllSkills()
  return skills.find((skill) => skill.id === id)
}
