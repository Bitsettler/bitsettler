/**
 * Audit script to find items without skill assignments
 * Helps identify gaps in our skill inference patterns
 */

import { getIndexes } from '@/lib/depv2/indexes';
import { inferSkillFromPatterns } from '@/lib/skill-inference-patterns';
import { getAllProfessionNames } from '@/lib/professions';

interface ItemAuditResult {
  id: string;
  name: string;
  category?: string;
  tags?: string[];
  assignedSkill?: string;
  tier?: number;
}

function auditItemSkillAssignments() {
  console.log('🔍 Auditing item skill assignments...\n');
  
  const { itemById } = getIndexes();
  const validProfessions = getAllProfessionNames();
  
  const results: ItemAuditResult[] = [];
  const skillCounts: Record<string, number> = {};
  let totalItems = 0;
  let itemsWithSkills = 0;
  
  // Initialize skill counts
  validProfessions.forEach(skill => skillCounts[skill] = 0);
  skillCounts['Unknown'] = 0;
  
  // Process all items
  for (const [id, item] of itemById.entries()) {
    totalItems++;
    
    const name = String(item?.name || '');
    const category = String(item?.category || '');
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    
    // Skip items with placeholder names
    if (!name || name.startsWith('#') || name.startsWith('{')) {
      continue;
    }
    
    const assignedSkill = inferSkillFromPatterns(name, category, tags) || 'Unknown';
    
    if (assignedSkill !== 'Unknown') {
      itemsWithSkills++;
    }
    
    skillCounts[assignedSkill]++;
    

    
    results.push({
      id,
      name,
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      assignedSkill,
      tier: Number(item?.tier) || undefined
    });
  }
  
  // Print summary statistics
  console.log('📊 SKILL ASSIGNMENT SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total items processed: ${totalItems}`);
  console.log(`Items with skills: ${itemsWithSkills} (${((itemsWithSkills / totalItems) * 100).toFixed(1)}%)`);
  console.log(`Items without skills: ${skillCounts['Unknown']} (${((skillCounts['Unknown'] / totalItems) * 100).toFixed(1)}%)\n`);
  
  // Print skill distribution
  console.log('🎯 SKILL DISTRIBUTION');
  console.log('=' .repeat(50));
  Object.entries(skillCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([skill, count]) => {
      const percentage = ((count / totalItems) * 100).toFixed(1);
      console.log(`${skill.padEnd(15)} ${count.toString().padStart(5)} (${percentage}%)`);
    });
  
  // Show detailed examples of items without skills
  console.log('\n🔍 DETAILED EXAMPLES OF UNTAGGED ITEMS');
  console.log('=' .repeat(60));
  const unknownItems = results
    .filter(item => item.assignedSkill === 'Unknown')
    .slice(0, 30);
  
  unknownItems.forEach((item, index) => {
    const categoryStr = item.category ? ` [Category: ${item.category}]` : '';
    const tagsStr = item.tags?.length ? ` [Tags: ${item.tags.join(', ')}]` : '';
    const tierStr = item.tier ? ` [Tier: ${item.tier}]` : '';
    console.log(`${(index + 1).toString().padStart(2)}. ${item.name}${categoryStr}${tagsStr}${tierStr}`);
  });
  
  if (skillCounts['Unknown'] > 30) {
    console.log(`... and ${skillCounts['Unknown'] - 30} more items without skills`);
  }
  
  // Show interesting patterns in unknown items
  console.log('\n🔍 COMMON PATTERNS IN UNKNOWN ITEMS');
  console.log('=' .repeat(50));
  
  const unknownNames = results
    .filter(item => item.assignedSkill === 'Unknown')
    .map(item => item.name.toLowerCase());
  
  // Find common words in unknown items
  const wordCounts: Record<string, number> = {};
  unknownNames.forEach(name => {
    const words = name.split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });
  
  const commonWords = Object.entries(wordCounts)
    .filter(([, count]) => count >= 3)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15);
  
  commonWords.forEach(([word, count]) => {
    console.log(`"${word}" appears in ${count} unknown items`);
  });

  // Group unknown items by category
  console.log('\n🔍 UNKNOWN ITEMS BY CATEGORY');
  console.log('=' .repeat(50));
  const unknownByCategory: Record<string, number> = {};
  results
    .filter(item => item.assignedSkill === 'Unknown')
    .forEach(item => {
      const category = item.category || 'No Category';
      unknownByCategory[category] = (unknownByCategory[category] || 0) + 1;
    });

  Object.entries(unknownByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([category, count]) => {
      console.log(`${category.padEnd(25)} ${count} items`);
    });
  
  return {
    totalItems,
    itemsWithSkills,
    skillCounts,
    unknownItems: results.filter(item => item.assignedSkill === 'Unknown'),
    allResults: results
  };
}

// Run the audit if this script is executed directly
if (require.main === module) {
  auditItemSkillAssignments();
}

export { auditItemSkillAssignments };
