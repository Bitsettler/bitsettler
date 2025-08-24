# Skill Inference Patterns

This system provides centralized skill assignment for items across the application.

## Files

- **`skill-inference-patterns.ts`** - Main patterns and logic
- **`depv2/display.ts`** - Material Calculator integration  
- **`settlement/project-items-table.tsx`** - Project grouping integration

## Usage

```typescript
import { inferSkillFromPatterns, getSkillFromItemName } from '@/lib/skill-inference-patterns';

// Full inference with name, category, tags
const skill = inferSkillFromPatterns('Copper Ingot', 'metal', ['refined']);

// Simple name-only inference (for project items)
const skill = getSkillFromItemName('Exquisite Amber Resin');
```

## Current Skills

Based on official BitCraft professions: https://bitjita.com/leaderboard/skills

### Gathering (6 professions)
- **Mining** - Raw materials from earth (ore, stone, gems, crystals)
- **Forestry** - Raw materials from trees (wood, logs, sap, resin)
- **Farming** - Agricultural products (crops, fibers, plants)
- **Fishing** - Aquatic resources (fish, shells, seaweed)
- **Hunting** - Animal products (meat, bones, antlers)
- **Foraging** - Wild plants and natural materials (mushrooms, nuts, wild herbs)

### Crafting (8 professions)  
- **Smithing** - Refined metals (ingots, bars, alloys)
- **Carpentry** - Processed wood (planks, furniture)
- **Tailoring** - Textiles and clothing (cloth, thread, garments)
- **Cooking** - Prepared foods (meals, baked goods)
- **Leatherworking** - Processed leather goods (hides, pelts, leather armor)
- **Masonry** - Processed stone (bricks, blocks, construction materials)
- **Construction** - Large-scale building projects (structures, walls, foundations)
- **Scholar** - Knowledge items (books, scrolls, research materials)

### Excluded Professions
We don't currently use: Merchanting, Sailing, Slayer, Taming

## Adding New Patterns

### Method 1: Edit the patterns file directly
```typescript
// Add to SKILL_PATTERNS array in skill-inference-patterns.ts
{
  skill: 'NewSkill',
  namePatterns: ['pattern1', 'pattern2'],
  categoryPatterns: ['category1'],
  description: 'What this skill covers'
}
```

### Method 2: Runtime updates (for testing)
```typescript
import { addSkillPattern, updateSkillPattern } from '@/lib/skill-inference-patterns';

// Add new skill
addSkillPattern({
  skill: 'Enchanting',
  namePatterns: ['enchanted', 'magical', 'rune'],
  categoryPatterns: ['magic'],
  description: 'Magical items and enchantments'
});

// Update existing skill
updateSkillPattern('Mining', {
  namePatterns: [...existingPatterns, 'quarry', 'excavated']
});
```

## Testing Changes

1. **Material Calculator** - Check skill assignments in calculator results
2. **Project Grouping** - Verify items group correctly in project detail pages
3. **AutoGen** - Ensure new projects categorize items properly

## Common Patterns to Add

When you find items without skills, consider these patterns:

- **Material states**: raw → processed → finished
- **Quality prefixes**: Basic, Fine, Exquisite, etc. (already handled)
- **Regional variants**: Different names for same materials
- **Tool/equipment types**: Specific crafting tools
- **Consumables**: Potions, foods, temporary items

## Debugging

```typescript
// Check what skill an item gets
console.log(getSkillFromItemName('Mysterious Item')); 

// See all available skills
import { getAllSkills } from '@/lib/skill-inference-patterns';
console.log(getAllSkills());

// Get patterns for specific skill
import { getPatternsForSkill } from '@/lib/skill-inference-patterns';
console.log(getPatternsForSkill('Mining'));
```
