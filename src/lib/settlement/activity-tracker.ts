/**
 * Activity Tracker - Detects and logs member activities/achievements
 * 
 * This service integrates with the sync process to detect when trackable
 * events occur and log them to the user_activity table.
 */

import { createServerClient } from '../spacetime-db-new/shared/supabase-client';

export interface MemberSkillChange {
  memberId: string;
  memberName: string;
  settlementId: string;
  skillChanges: SkillChange[];
  totalLevel: number;
  skillCount: number;
}

export interface SkillChange {
  skillId: string;
  skillName: string;
  oldLevel: number;
  newLevel: number;
}

export interface ActivityLogEntry {
  member_id: string;
  activity_type: string;
  activity_data: {
    eventId: string;
    eventName: string;
    description?: string;
    skillId?: string;
    skillName?: string;
    oldLevel?: number;
    newLevel?: number;
    levelGain?: number;
    isFirst?: boolean;
    icon?: string;
    color?: string;
    [key: string]: any;
  };
}

/**
 * Simple profession level-up tracking function - call this during member sync
 */
export async function trackMemberActivity(changes: MemberSkillChange): Promise<void> {
  try {
    const activities: ActivityLogEntry[] = [];
    
    // Process each skill change - only track profession skills
    for (const skillChange of changes.skillChanges) {
      
      // Only track profession skills (simple check)
      if (!isProfessionSkill(skillChange.skillName)) {
        continue;
      }
      
      // Create a simple level-up activity for each level gained
      for (let level = skillChange.oldLevel + 1; level <= skillChange.newLevel; level++) {
        const activity: ActivityLogEntry = {
          member_id: changes.memberId,
          activity_type: 'profession_level_up',
          activity_data: {
            eventId: 'profession_level_up',
            eventName: 'Profession Level-Up',
            skillName: skillChange.skillName,
            newLevel: level,
            oldLevel: level - 1,
            levelGain: 1,
            icon: getSkillIcon(skillChange.skillName),
            memberName: changes.memberName,
            timestamp: new Date().toISOString()
          }
        };
        
        activities.push(activity);
        console.log(`📈 ${changes.memberName} reached level ${level} in ${skillChange.skillName}`);
      }
    }
    
    // Log all activities to database
    if (activities.length > 0) {
      await logActivitiesToDatabase(activities);
    }
    
  } catch (error) {
    console.error('Error tracking member activity:', error);
  }
}

/**
 * Check if a skill is a profession skill
 */
function isProfessionSkill(skillName: string): boolean {
  const professionSkills = [
    'Forestry', 'Carpentry', 'Masonry', 'Mining', 'Smithing', 
    'Scholar', 'Leatherworking', 'Hunting', 'Tailoring', 
    'Farming', 'Fishing', 'Foraging'
  ];
  return professionSkills.includes(skillName);
}

/**
 * Get an appropriate icon for a skill
 */
function getSkillIcon(skillName: string): string {
  const skillIcons: Record<string, string> = {
    'Forestry': '🌲',
    'Carpentry': '🪚', 
    'Masonry': '🧱',
    'Mining': '⛏️',
    'Smithing': '⚒️',
    'Scholar': '📚',
    'Leatherworking': '🦬',
    'Hunting': '🏹',
    'Tailoring': '🪡',
    'Farming': '🌾',
    'Fishing': '🎣',
    'Foraging': '🍄'
  };
  
  return skillIcons[skillName] || '⬆️';
}



/**
 * Log multiple activities to the database
 */
async function logActivitiesToDatabase(activities: ActivityLogEntry[]): Promise<void> {
  const supabase = createServerClient();
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('user_activity')
      .insert(activities);
    
    if (error) {
      console.error('Error logging activities to database:', error);
    } else {
      console.log(`✅ Logged ${activities.length} member activities to database`);
    }
    
  } catch (error) {
    console.error('Error inserting activities:', error);
  }
}

/**
 * Get recent settlement activities (collective actions affecting the settlement)
 */
export async function getRecentSettlementActivities(
  settlementId: string, 
  limit: number = 20,
  membersIdList: string[]
): Promise<any[]> {
  const supabase = createServerClient();
  if (!supabase) return [];

  
  // Settlement activity types (collective actions)
  const settlementActivityTypes = [
    'project_contribution',
    'project_created', 
    'project_completed',
    'treasury_transaction',
    'settlement_upgrade'
  ];
  
  try {
     const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .in('member_id', membersIdList)
      .in('activity_type', settlementActivityTypes)
      .order('created_at', { ascending: false })
      .limit(limit);
      
      if (error) {
        console.error('Error fetching recent settlement activities:', error);
        return [];
      }
      
      return data || [];
    
  } catch (error) {
    console.error('Error getting recent settlement activities:', error);
    return [];
  }
}

/**
 * Get recent member activities (individual member actions)
 */
export async function getRecentMemberActivities(
  settlementId: string, 
  limit: number = 20,
  membersIdList: string[]
): Promise<any[]> {
  const supabase = createServerClient();
  if (!supabase) return [];
  
  // Member activity types (individual actions)
  const memberActivityTypes = [
    'profession_level_up',
    'achievement_unlocked',
    'member_joined',
    'member_promoted',
    'skill_milestone'
  ];
  
  try {

     const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .in('member_id', membersIdList)
      .in('activity_type', memberActivityTypes)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent member activities:', error);
      return [];
    }
    
    return data || [];
    
  } catch (error) {
    console.error('Error getting recent member activities:', error);
    return [];
  }
}

/**
 * Helper function to detect skill changes between old and new skill data
 */
export function detectSkillChanges(
  oldSkills: Record<string, number> = {},
  newSkills: Record<string, number> = {},
  skillNameMap: Record<string, string> = {}
): SkillChange[] {
  const changes: SkillChange[] = [];
  
  // Check all skills in the new data
  for (const [skillId, newLevel] of Object.entries(newSkills)) {
    const oldLevel = oldSkills[skillId] || 0;
    
    if (newLevel > oldLevel) {
      changes.push({
        skillId,
        skillName: skillNameMap[skillId] || skillId,
        oldLevel,
        newLevel
      });
    }
  }
  
  return changes;
}