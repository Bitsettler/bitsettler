export interface Profession {
  id: string;
  name: string;
  imagePath: string;
  fallbackColor: string;
  description: string;
}

export const PROFESSIONS: Profession[] = [
  {
    id: 'alchemy',
    name: 'Alchemy',
    imagePath: '/assets/ProfessionAvatars/Alchemy.webp',
    fallbackColor: '#8B5CF6',
    description: 'Master of potions and magical concoctions'
  },
  {
    id: 'artificing',
    name: 'Artificing',
    imagePath: '/assets/ProfessionAvatars/Artificing.webp',
    fallbackColor: '#3B82F6',
    description: 'Creator of magical tools and artifacts'
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    imagePath: '/assets/ProfessionAvatars/Carpentry.webp',
    fallbackColor: '#92400E',
    description: 'Expert woodworker and furniture crafter'
  },
  {
    id: 'combat',
    name: 'Combat',
    imagePath: '/assets/ProfessionAvatars/Combat.webp',
    fallbackColor: '#DC2626',
    description: 'Skilled warrior and protector'
  },
  {
    id: 'cooking',
    name: 'Cooking',
    imagePath: '/assets/ProfessionAvatars/Cooking.webp',
    fallbackColor: '#F59E0B',
    description: 'Culinary expert and master chef'
  },
  {
    id: 'exploration',
    name: 'Exploration',
    imagePath: '/assets/ProfessionAvatars/Exploration.webp',
    fallbackColor: '#06B6D4',
    description: 'Adventurous explorer and pathfinder'
  },
  {
    id: 'farming',
    name: 'Farming',
    imagePath: '/assets/ProfessionAvatars/Farming.webp',
    fallbackColor: '#84CC16',
    description: 'Agricultural specialist and crop cultivator'
  },
  {
    id: 'fishing',
    name: 'Fishing',
    imagePath: '/assets/ProfessionAvatars/Fishing.webp',
    fallbackColor: '#0EA5E9',
    description: 'Master angler and aquatic resource gatherer'
  },
  {
    id: 'foraging',
    name: 'Foraging',
    imagePath: '/assets/ProfessionAvatars/Foraging.webp',
    fallbackColor: '#10B981',
    description: 'Expert gatherer of wild resources'
  },
  {
    id: 'forestry',
    name: 'Forestry',
    imagePath: '/assets/ProfessionAvatars/Forestry.webp',
    fallbackColor: '#059669',
    description: 'Forest steward and lumber specialist'
  },
  {
    id: 'hunting',
    name: 'Hunting',
    imagePath: '/assets/ProfessionAvatars/Hunting.webp',
    fallbackColor: '#92400E',
    description: 'Skilled hunter and tracker'
  },
  {
    id: 'leatherworking',
    name: 'Leatherworking',
    imagePath: '/assets/ProfessionAvatars/Leatherworking.webp',
    fallbackColor: '#A16207',
    description: 'Leather crafter and hide processor'
  },
  {
    id: 'masonry',
    name: 'Masonry',
    imagePath: '/assets/ProfessionAvatars/Masonry.webp',
    fallbackColor: '#6B7280',
    description: 'Stone worker and construction specialist'
  },
  {
    id: 'mining',
    name: 'Mining',
    imagePath: '/assets/ProfessionAvatars/Mining.webp',
    fallbackColor: '#374151',
    description: 'Underground explorer and ore extractor'
  },
  {
    id: 'smithing',
    name: 'Smithing',
    imagePath: '/assets/ProfessionAvatars/Smithing.webp',
    fallbackColor: '#EF4444',
    description: 'Master metalworker and weapon crafter'
  },
  {
    id: 'survival',
    name: 'Survival',
    imagePath: '/assets/ProfessionAvatars/Survival.webp',
    fallbackColor: '#7C2D12',
    description: 'Wilderness survivor and resourceful crafter'
  },
  {
    id: 'tailoring',
    name: 'Tailoring',
    imagePath: '/assets/ProfessionAvatars/Tailoring.webp',
    fallbackColor: '#9333EA',
    description: 'Textile expert and clothing designer'
  },
  {
    id: 'trading',
    name: 'Trading',
    imagePath: '/assets/ProfessionAvatars/Trading.webp',
    fallbackColor: '#D97706',
    description: 'Merchant and economic strategist'
  }
];

export const getProfessionById = (id: string): Profession | undefined => {
  return PROFESSIONS.find(profession => profession.id === id);
};

export const getProfessionByName = (name: string): Profession | undefined => {
  return PROFESSIONS.find(profession => profession.name.toLowerCase() === name.toLowerCase());
}; 