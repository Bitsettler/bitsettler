/**
 * Settlement Activity Events Configuration
 * 
 * Define all trackable events, milestones, and achievements here.
 * This config-driven approach makes it easy to add new events without code changes.
 */

export interface ActivityEventConfig {
  id: string;                           // Unique identifier
  type: ActivityEventType;              // Category of event
  name: string;                         // Display name
  description?: string;                 // Optional description
  condition: EventCondition;            // When this event triggers
  priority: 'low' | 'medium' | 'high';  // Display priority
  icon?: string;                        // Optional icon
  color?: string;                       // Optional color theme
  oneTime?: boolean;                    // If true, only triggers once per member
}

export type ActivityEventType = 
  | 'skill_level_up'           // Standard level-ups
  | 'skill_milestone'          // Major skill achievements  
  | 'skill_first'             // Settlement firsts
  | 'member_join'             // Member activity
  | 'member_achievement'      // Personal achievements
  | 'settlement_milestone'    // Settlement-wide achievements
  | 'project_activity'        // Project-related activities
  | 'custom';                 // Custom events

export interface EventCondition {
  trigger: 'skill_change' | 'member_join' | 'project_activity' | 'custom_check';
  criteria: SkillCriteria | MemberCriteria | ProjectCriteria | CustomCriteria;
}

export interface SkillCriteria {
  skillIds?: string[];        // Specific skills (empty = all skills)
  levelThresholds?: number[]; // Trigger at these levels
  levelMultiples?: number;    // Trigger every X levels (e.g., every 5)
  minimumLevel?: number;      // Only trigger above this level
  isFirst?: boolean;          // First in settlement to reach this
}

export interface MemberCriteria {
  totalLevelThreshold?: number;
  skillCountThreshold?: number;
  daysActive?: number;
}

export interface ProjectCriteria {
  projectAction: 'created' | 'completed' | 'contribution_added' | 'status_changed';
  projectPriority?: number[];     // Only for specific priority projects
  minContributionValue?: number;  // For contribution events
}

export interface CustomCriteria {
  checkFunction: string;      // Name of custom check function
  parameters?: any;
}

/**
 * SKILL GROUPS FOR PROFESSION-SPECIFIC EVENTS
 */
export const SKILL_GROUPS = {
  PROFESSION_SKILLS: [
    'Forestry', 'Carpentry', 'Masonry', 'Mining', 'Smithing', 
    'Scholar', 'Leatherworking', 'Hunting', 'Tailoring', 
    'Farming', 'Fishing', 'Foraging'
  ],
  ADVENTURE_SKILLS: [
    'Cooking', 'Construction', 'Taming', 'Slayer', 'Merchanting', 'Sailing'
  ]
};

/**
 * ACTIVITY EVENTS CONFIGURATION - Simple Profession Level-Ups
 * Just tracking level-ups for profession skills to start simple!
 */
export const ACTIVITY_EVENTS: ActivityEventConfig[] = [
  
  // === PROFESSION SKILL LEVEL-UPS ===
  {
    id: 'profession_level_up',
    type: 'skill_level_up',
    name: 'Profession Level-Up',
    description: 'Gained a level in a profession skill',
    condition: {
      trigger: 'skill_change',
      criteria: {
        skillIds: SKILL_GROUPS.PROFESSION_SKILLS,
        minimumLevel: 1
      }
    },
    priority: 'medium',
    icon: '⬆️'
  },

  // === PROJECT ACTIVITIES ===
  {
    id: 'project_created',
    type: 'project_activity',
    name: 'Project Created',
    description: 'Started a new settlement project',
    condition: {
      trigger: 'project_activity',
      criteria: {
        projectAction: 'created'
      }
    },
    priority: 'medium',
    icon: '🏗️',
    color: '#3B82F6'
  },

  {
    id: 'project_completed',
    type: 'project_activity',
    name: 'Project Completed',
    description: 'Successfully completed a settlement project',
    condition: {
      trigger: 'project_activity',
      criteria: {
        projectAction: 'completed'
      }
    },
    priority: 'high',
    icon: '✅',
    color: '#10B981'
  },

  {
    id: 'project_contribution',
    type: 'project_activity',
    name: 'Project Contribution',
    description: 'Contributed to a settlement project',
    condition: {
      trigger: 'project_activity',
      criteria: {
        projectAction: 'contribution_added'
      }
    },
    priority: 'medium',
    icon: '🤝',
    color: '#8B5CF6'
  },

  {
    id: 'high_priority_project_created',
    type: 'project_activity',
    name: 'Critical Project Started',
    description: 'Started a high-priority settlement project',
    condition: {
      trigger: 'project_activity',
      criteria: {
        projectAction: 'created',
        projectPriority: [4, 5]
      }
    },
    priority: 'high',
    icon: '🚨',
    color: '#EF4444'
  }
];

/**
 * Helper function to get events by type
 */
export function getEventsByType(type: ActivityEventType): ActivityEventConfig[] {
  return ACTIVITY_EVENTS.filter(event => event.type === type);
}

/**
 * Helper function to get events that should trigger for a skill change
 */
export function getSkillChangeEvents(): ActivityEventConfig[] {
  return ACTIVITY_EVENTS.filter(event => 
    event.condition.trigger === 'skill_change'
  );
}

/**
 * Check if an event should trigger based on skill data
 */
export function shouldEventTrigger(
  event: ActivityEventConfig,
  skillData: {
    skillId: string;
    skillName: string; 
    oldLevel: number;
    newLevel: number;
    memberTotalLevel: number;
    memberSkillCount: number;
    isFirstInSettlement?: boolean;
  }
): boolean {
  if (event.condition.trigger !== 'skill_change') return false;
  
  const criteria = event.condition.criteria as SkillCriteria;
  
  // Check skill specificity
  if (criteria.skillIds && criteria.skillIds.length > 0) {
    if (!criteria.skillIds.includes(skillData.skillName)) {
      return false;
    }
  }
  
  // Check minimum level
  if (criteria.minimumLevel && skillData.newLevel < criteria.minimumLevel) {
    return false;
  }
  
  // Check specific level thresholds
  if (criteria.levelThresholds && criteria.levelThresholds.length > 0) {
    const hitThreshold = criteria.levelThresholds.some(threshold => 
      skillData.oldLevel < threshold && skillData.newLevel >= threshold
    );
    if (!hitThreshold) return false;
  }
  
  // Check level multiples (every X levels)
  if (criteria.levelMultiples) {
    const oldMilestone = Math.floor(skillData.oldLevel / criteria.levelMultiples);
    const newMilestone = Math.floor(skillData.newLevel / criteria.levelMultiples);
    if (oldMilestone >= newMilestone) return false;
  }
  
  // Check if this needs to be first in settlement
  if (criteria.isFirst && !skillData.isFirstInSettlement) {
    return false;
  }
  
  // Check member-level criteria
  const memberCriteria = event.condition.criteria as MemberCriteria;
  if (memberCriteria.totalLevelThreshold && skillData.memberTotalLevel < memberCriteria.totalLevelThreshold) {
    return false;
  }
  
  if (memberCriteria.skillCountThreshold && skillData.memberSkillCount < memberCriteria.skillCountThreshold) {
    return false;
  }
  
  return true;
}