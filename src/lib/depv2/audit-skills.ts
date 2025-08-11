/**
 * Skill assignment audit utilities for debugging
 */
import { getItemDisplay, auditItemsWithoutSkills } from './display'
import { getItemById, getItemToSkill } from './indexes'

// Make available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).runSkillAudit = runSkillAudit
  (window as any).auditItemsWithoutSkills = auditItemsWithoutSkills
}

export function runSkillAudit() {
  console.log('🔍 Starting comprehensive skill audit...')
  
  const audit = auditItemsWithoutSkills()
  const itemById = getItemById()
  const itemToSkill = getItemToSkill()
  
  // Categorize items without skills
  const categories = {
    outputs: [] as any[],
    questItems: [] as any[],
    templateItems: [] as any[],
    normalItems: [] as any[]
  }
  
  for (const item of audit.withoutSkills) {
    const originalItem = itemById.get(item.id)
    const name = item.name.toLowerCase()
    
    if (name.includes('output')) {
      categories.outputs.push(item)
    } else if (name.includes('tutorial') || name.includes('quest') || name.includes('starter')) {
      categories.questItems.push(item)
    } else if (name.includes('{') || name.includes('}') || name === `#${item.id}`) {
      categories.templateItems.push(item)
    } else {
      categories.normalItems.push(item)
    }
  }
  
  console.log('\n📋 Breakdown by category:')
  console.log(`Output items (recipe outputs): ${categories.outputs.length}`)
  console.log(`Quest/Tutorial items: ${categories.questItems.length}`)
  console.log(`Template/Invalid items: ${categories.templateItems.length}`)
  console.log(`Normal items missing skills: ${categories.normalItems.length}`)
  
  console.log('\n🎯 Normal items that should have skills:')
  categories.normalItems.slice(0, 20).forEach(item => {
    console.log(`  - ${item.name} (${item.id}) Tier: ${item.tier || 'N/A'}`)
  })
  
  // Make results available globally for browser console
  if (typeof window !== 'undefined') {
    ;(window as any).skillAuditResults = {
      total: audit.total,
      withoutSkills: audit.withoutSkills.length,
      categories,
      byCategory: categories
    }
    console.log('\n💡 Results available in browser as: window.skillAuditResults')
  }
  
  return categories
}

// Auto-run audit in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => runSkillAudit(), 1000)
}
