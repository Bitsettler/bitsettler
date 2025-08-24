/**
 * Centralized skill inference patterns for item categorization
 * Used by both Material Calculator (display.ts) and Project AutoGen
 * 
 * This file provides a single source of truth for skill assignments
 * that can be easily maintained and updated over time.
 * 
 * For the official list of professions, see: @/lib/professions.ts
 */

import { getAllProfessionNames } from './professions';

export interface SkillPattern {
  skill: string;
  namePatterns: string[];
  categoryPatterns: string[];
  description?: string;
}

/**
 * Comprehensive skill inference patterns
 * Order matters - more specific patterns should come first
 */
export const SKILL_PATTERNS: SkillPattern[] = [
  // GATHERING PROFESSIONS
  {
    skill: 'Mining',
    namePatterns: [
      'ore', 'raw stone', 'mineral', 'gem', 'crystal',
      'gypsite', 'ancient', 'damaged',
      'chunk', 'flint', 'quarried', 'ruby', 'emerald', 'diamond',
      'sapphire', 'topaz', 'amethyst', 'uncut', 'rough gem',
      'nugget', 'rock', 'salt', 'ash', 'charcoal'
    ],
    categoryPatterns: ['ore', 'mineral', 'raw stone'],
    description: 'Raw materials extracted from the earth'
  },
  
  {
    skill: 'Forestry', 
    namePatterns: [
      'wood', 'log', 'bark', 'sap', 'resin', 'timber', 'branch',
      'lumber', 'twig', 'pine', 'oak', 'birch', 'tree', 'stick',
      'tool handle', 'handle', 'twine', 'rope'
    ],
    categoryPatterns: ['wood', 'tree', 'lumber'],
    description: 'Raw materials from trees and forests'
  },
  
    {
    skill: 'Farming',
    namePatterns: [
      'berry', 'fruit', 'flower', 'seed', 'grain', 'vegetable',
      'herb', 'bulb', 'fiber', 'straw', 'cotton',
      'flax', 'crop', 'harvest', 'fertilizer', 'tannin', 'bait',
      'cultivated', 'farmed', 'grown'
    ],
    categoryPatterns: ['plant', 'food', 'fiber', 'crop'],
    description: 'Agricultural products and plant materials'
  },
  
  {
    skill: 'Fishing',
    namePatterns: [
      'fish', 'scale', 'shell', 'seaweed', 'coral', 'pearl',
      'kelp', 'oyster', 'crab', 'lobster', 'shrimp', 'algae',
      'crawdad', 'darter', 'marlin', 'filet', 'fin', 'prawn',
      'eel', 'tuna', 'shark', 'experiment'
    ],
    categoryPatterns: ['fish', 'aquatic', 'seafood'],
    description: 'Aquatic resources and marine life'
  },
  
  {
    skill: 'Hunting',
    namePatterns: [
      'bone', 'horn', 'feather', 'meat', 'antler', 'claw', 'fang',
      'blood', 'trophy', 'animal output', 'sagi bird', 'nubi goat', 
      'scrofa', 'tundra ox', 'bird', 'goat', 'ox'
    ],
    categoryPatterns: ['animal', 'meat', 'trophy'],
    description: 'Animal products from hunting (non-leather materials)'
  },

  {
    skill: 'Foraging',
    namePatterns: [
      'wild', 'foraged', 'mushroom', 'nut', 'wild berry', 'wild herb',
      'wild flower', 'wild plant', 'gathered', 'natural', 'cocoon',
      'plant root', 'plant roots', 'wild root', 'roots', 'root', 'pebbles'
    ],
    categoryPatterns: ['wild', 'foraged', 'natural'],
    description: 'Wild plants, herbs, and natural materials'
  },

  // CRAFTING PROFESSIONS  
  {
    skill: 'Smithing',
    namePatterns: [
      'ingot', 'bar', 'concentrate', 'alloy', 'steel', 'iron', 'copper',
      'tin', 'metal', 'refined', 'smelted', 'forged', 'plated',
      'aurumite', 'umbracite', 'celestium', 'astralite', 'rathium', 
      'luminite', 'elenvar', 'emarium', 'ferralith', 'pyrelite'
    ],
    categoryPatterns: ['metal', 'ingot', 'alloy'],
    description: 'Refined metals and metalworking materials'
  },
  
  {
    skill: 'Carpentry',
    namePatterns: [
      'plank', 'board', 'beam', 'lumber', 'processed wood', 'wooden',
      'furniture', 'cabinet', 'table', 'chair', 'mallet', 'door',
      'bed', 'wicker'
    ],
    categoryPatterns: ['furniture', 'wooden'],
    description: 'Processed wood and wooden constructions'
  },
  
  {
    skill: 'Tailoring',
    namePatterns: [
      'cloth', 'fabric', 'thread', 'yarn', 'textile', 'linen',
      'canvas', 'silk', 'cotton', 'wool', 'garment', 'clothing',
      'woven', 'shirt', 'robe', 'dress', 'tunic', 'cloak', 'hat',
      'cap', 'hood', 'gloves', 'mittens', 'bonnet', 'vest', 'jacket',
      'pants', 'skirt', 'trousers', 'shorts', 'waistwrap', 'leggings',
      'shoes', 'footwraps', 'armwraps', 'wispweave', 'filament'
    ],
    categoryPatterns: ['textile', 'clothing', 'fabric'],
    description: 'Textiles and clothing materials'
  },
  
  {
    skill: 'Cooking',
    namePatterns: [
      'food', 'meal', 'dish', 'recipe', 'cooked', 'baked', 'roasted',
      'stew', 'soup', 'bread', 'pie', 'cake', 'prepared', 'cooking pot',
      'pot', 'bucket', 'water bucket', 'animal fat', 'pitch', 'chum',
      'tea', 'hot tea', 'chilling tea', 'sugar', 'egg'
    ],
    categoryPatterns: ['food', 'meal', 'consumable'],
    description: 'Prepared foods and cooking ingredients'
  },
  
  {
    skill: 'Leatherworking',
    namePatterns: [
      'hide', 'pelt', 'leather', 'fur', 'hair', 'animal hair', 'wool', 'silk',
      'tanned', 'cured leather', 'leather armor', 'leather goods',
      'processed hide', 'worked leather', 'belt', 'strap', 'harness',
      'leather belt', 'leather strap', 'leather boots', 'boots',
      'hideworking salt'
    ],
    categoryPatterns: ['leather goods', 'leather armor', 'hide'],
    description: 'Animal hides, pelts, and processed leather goods'
  },

  {
    skill: 'Masonry',
    namePatterns: [
      'brick', 'block', 'stone block', 'stone brick', 'limestone', 'sandstone', 'marble',
      'granite', 'cobblestone', 'flagstone', 'tile', 'mortar',
      'cement', 'concrete', 'carved stone', 'stone wall', 'foundation',
      'braxite', 'sand', 'clay', 'raw stone', 'brickworking', 'binding ash'
    ],
    categoryPatterns: ['construction', 'building materials', 'stonework'],
    description: 'Processed stone and construction materials'
  },

  {
    skill: 'Construction',
    namePatterns: [
      'building', 'structure', 'wall', 'roof', 'foundation', 'frame',
      'construction', 'blueprint', 'architecture', 'built'
    ],
    categoryPatterns: ['building', 'structure', 'construction'],
    description: 'Large-scale building and construction projects'
  },

  {
    skill: 'Scholar',
    namePatterns: [
      'stone carvings', 'stone carving', 'carvings', 'carving',
      'book', 'scroll', 'tome', 'codex', 'research', 'knowledge',
      'study', 'manuscript', 'parchment', 'ink', 'quill', 'academic',
      'paper', 'writing', 'text', 'journal', 'notes', 'schematic',
      'pigment', 'hieroglyphs', 'elixir', 'draught', 'potion',
      'catalyst', 'bandage', 'vial', 'glass',
      'treatment', 'solvent', 'leather treatment', 'metal solvent'
    ],
    categoryPatterns: ['knowledge', 'research', 'academic'],
    description: 'Knowledge items and scholarly materials'
  },

  {
    skill: 'Misc',
    namePatterns: [
      'hex coin', 'coin', 'deed', 'contract', 'document', 'certificate', 
      'license', 'mark of', 'fragment', 'energy', 'developer', 'master tool',
      'training', 'botter', 'admin', 'debug', 'test', 'key', 'emblem',
      'adventurer\'s note', 'starseeker', 'immortal', 'automata', 'settlements'
    ],
    categoryPatterns: ['currency', 'administrative', 'special', 'developer'],
    description: 'Special items, currency, developer tools, and miscellaneous items'
  }
];

/**
 * Infer skill from item name and category using centralized patterns
 */
export function inferSkillFromPatterns(
  name: string, 
  category?: string, 
  tags?: string[]
): string | undefined {
  const lowerName = name.toLowerCase();
  const lowerCategory = category?.toLowerCase() || '';
  
  for (const pattern of SKILL_PATTERNS) {
    // Check name patterns
    if (pattern.namePatterns.some(p => lowerName.includes(p))) {
      return pattern.skill;
    }
    
    // Check category patterns
    if (pattern.categoryPatterns.some(p => lowerCategory.includes(p))) {
      return pattern.skill;
    }
  }
  
  return undefined;
}

/**
 * Get all available skills
 */
export function getAllSkills(): string[] {
  return [...new Set(SKILL_PATTERNS.map(p => p.skill))];
}

/**
 * Get patterns for a specific skill
 */
export function getPatternsForSkill(skill: string): SkillPattern | undefined {
  return SKILL_PATTERNS.find(p => p.skill === skill);
}

/**
 * Add new pattern (for runtime updates)
 */
export function addSkillPattern(pattern: SkillPattern): void {
  SKILL_PATTERNS.push(pattern);
}

/**
 * Update existing pattern
 */
export function updateSkillPattern(skill: string, updates: Partial<SkillPattern>): boolean {
  const index = SKILL_PATTERNS.findIndex(p => p.skill === skill);
  if (index >= 0) {
    SKILL_PATTERNS[index] = { ...SKILL_PATTERNS[index], ...updates };
    return true;
  }
  return false;
}

/**
 * Convenience function for project items - infer skill from just item name
 */
export function getSkillFromItemName(itemName: string): string {
  return inferSkillFromPatterns(itemName) || 'Unknown';
}

/**
 * Validate that all skill patterns reference valid professions
 */
export function validateSkillPatterns(): { valid: boolean; errors: string[] } {
  const validProfessions = getAllProfessionNames();
  const errors: string[] = [];
  
  for (const pattern of SKILL_PATTERNS) {
    if (!validProfessions.includes(pattern.skill)) {
      errors.push(`Invalid profession in patterns: ${pattern.skill}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
