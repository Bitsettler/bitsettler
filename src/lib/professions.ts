/**
 * Centralized list of all professions in BitCraft
 * Separates gathering professions from crafting professions
 */

export interface Profession {
  name: string;
  type: 'gathering' | 'crafting';
  description: string;
  icon?: string; // For future UI use
}

/**
 * All gathering professions - extract raw materials from the world
 * Based on official BitCraft professions: https://bitjita.com/leaderboard/skills
 */
export const GATHERING_PROFESSIONS: Profession[] = [
  {
    name: 'Mining',
    type: 'gathering',
    description: 'Extract ores, gems, and raw stone from the earth'
  },
  {
    name: 'Forestry',
    type: 'gathering', 
    description: 'Harvest wood, sap, and other tree materials'
  },
  {
    name: 'Farming',
    type: 'gathering',
    description: 'Grow crops, harvest plants, and gather agricultural materials'
  },
  {
    name: 'Fishing',
    type: 'gathering',
    description: 'Catch fish and gather aquatic resources'
  },
  {
    name: 'Hunting',
    type: 'gathering',
    description: 'Hunt animals for meat, bones, and other materials'
  },
  {
    name: 'Foraging',
    type: 'gathering',
    description: 'Gather wild plants, herbs, and natural materials'
  }
];

/**
 * All crafting professions - process raw materials into finished goods
 * Based on official BitCraft professions: https://bitjita.com/leaderboard/skills
 */
export const CRAFTING_PROFESSIONS: Profession[] = [
  {
    name: 'Smithing',
    type: 'crafting',
    description: 'Smelt ores into ingots and craft metal tools/weapons'
  },
  {
    name: 'Carpentry',
    type: 'crafting',
    description: 'Process wood into planks and craft wooden items/furniture'
  },
  {
    name: 'Tailoring',
    type: 'crafting',
    description: 'Weave textiles and craft clothing/fabric goods'
  },
  {
    name: 'Cooking',
    type: 'crafting',
    description: 'Prepare food and craft consumable items'
  },
  {
    name: 'Leatherworking',
    type: 'crafting',
    description: 'Process hides/pelts into leather and craft leather goods'
  },
  {
    name: 'Masonry',
    type: 'crafting',
    description: 'Process stone into bricks/blocks and craft construction materials'
  },
  {
    name: 'Construction',
    type: 'crafting',
    description: 'Build structures and large-scale construction projects'
  },
  {
    name: 'Scholar',
    type: 'crafting',
    description: 'Research, create knowledge items, and craft scholarly materials'
  },
  {
    name: 'Misc',
    type: 'crafting',
    description: 'Special items, currency, developer tools, and other miscellaneous items'
  }
];

/**
 * Professions we don't currently use in BitSettler
 * (Excluded from our skill inference patterns)
 */
export const UNUSED_PROFESSIONS = [
  'Merchanting',
  'Sailing', 
  'Slayer',
  'Taming'
] as const;

/**
 * All professions combined
 */
export const ALL_PROFESSIONS: Profession[] = [
  ...GATHERING_PROFESSIONS,
  ...CRAFTING_PROFESSIONS
];

/**
 * Get profession by name
 */
export function getProfession(name: string): Profession | undefined {
  return ALL_PROFESSIONS.find(p => p.name === name);
}

/**
 * Get all profession names
 */
export function getAllProfessionNames(): string[] {
  return ALL_PROFESSIONS.map(p => p.name);
}

/**
 * Get professions by type
 */
export function getProfessionsByType(type: 'gathering' | 'crafting'): Profession[] {
  return ALL_PROFESSIONS.filter(p => p.type === type);
}

/**
 * Check if a profession is gathering or crafting
 */
export function isGatheringProfession(name: string): boolean {
  return GATHERING_PROFESSIONS.some(p => p.name === name);
}

export function isCraftingProfession(name: string): boolean {
  return CRAFTING_PROFESSIONS.some(p => p.name === name);
}

/**
 * Get profession counts
 */
export function getProfessionStats() {
  return {
    total: ALL_PROFESSIONS.length,
    gathering: GATHERING_PROFESSIONS.length,
    crafting: CRAFTING_PROFESSIONS.length
  };
}
