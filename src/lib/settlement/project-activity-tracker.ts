/**
 * Project Activity Tracker - Logs project-related settlement activities
 * 
 * This tracks internal application activities for projects:
 * - Project creation
 * - Project completion
 * - Project contributions
 */

import { createServerClient } from '../spacetime-db-new/shared/supabase-client';
import { ACTIVITY_EVENTS, type ProjectCriteria } from './activity-events-config';

export interface ProjectActivityData {
  memberId: string;
  memberName: string;
  projectId: string;
  projectName: string;
  projectPriority: number;
  action: 'created' | 'completed' | 'contribution_added' | 'status_changed';
  contributionDetails?: {
    itemName: string;
    quantity: number;
    notes?: string;
  };
  oldStatus?: string;
  newStatus?: string;
}

export interface ProjectActivityLogEntry {
  member_id: string;
  activity_type: string;
  activity_data: {
    eventId: string;
    eventName: string;
    description: string;
    projectId: string;
    projectName: string;
    projectPriority: number;
    action: string;
    icon?: string;
    color?: string;
    memberName: string;
    timestamp: string;
    contributionDetails?: any;
    statusChange?: {
      from: string;
      to: string;
    };
    [key: string]: any;
  };
}

/**
 * Track project activity - call this when project events occur
 */
export async function trackProjectActivity(activityData: ProjectActivityData): Promise<void> {
  try {
    const activities: ProjectActivityLogEntry[] = [];
    
    // Find matching events for this project action
    const matchingEvents = ACTIVITY_EVENTS.filter(event => {
      if (event.condition.trigger !== 'project_activity') return false;
      
      const criteria = event.condition.criteria as ProjectCriteria;
      
      // Check if this is the right action type
      if (criteria.projectAction !== activityData.action) return false;
      
      // Check priority filter if specified
      if (criteria.projectPriority && criteria.projectPriority.length > 0) {
        if (!criteria.projectPriority.includes(activityData.projectPriority)) return false;
      }
      
      return true;
    });
    
    // Create activity log entries for each matching event
    for (const event of matchingEvents) {
      const activity: ProjectActivityLogEntry = {
        member_id: activityData.memberId,
        activity_type: event.id,
        activity_data: {
          eventId: event.id,
          eventName: event.name,
          description: generateDescription(activityData),
          projectId: activityData.projectId,
          projectName: activityData.projectName,
          projectPriority: activityData.projectPriority,
          action: activityData.action,
          icon: event.icon,
          color: event.color,
          memberName: activityData.memberName,
          timestamp: new Date().toISOString()
        }
      };
      
      // Add specific details based on action type
      if (activityData.action === 'contribution_added' && activityData.contributionDetails) {
        activity.activity_data.contributionDetails = activityData.contributionDetails;
      }
      
      if (activityData.action === 'status_changed' && activityData.oldStatus && activityData.newStatus) {
        activity.activity_data.statusChange = {
          from: activityData.oldStatus,
          to: activityData.newStatus
        };
      }
      
      activities.push(activity);
      
      // Log to console for debugging
      console.log(`🏗️ ${activityData.memberName} ${event.name.toLowerCase()}: "${activityData.projectName}"`);
    }
    
    // Log all activities to database
    if (activities.length > 0) {
      await logProjectActivitiesToDatabase(activities);
    }
    
  } catch (error) {
    console.error('Error tracking project activity:', error);
  }
}

/**
 * Generate human-readable description for project activities
 */
function generateDescription(activityData: ProjectActivityData): string {
  switch (activityData.action) {
    case 'created':
      return `Started new project "${activityData.projectName}"`;
    
    case 'completed':
      return `Completed project "${activityData.projectName}"`;
    
    case 'contribution_added':
      if (activityData.contributionDetails) {
        const { itemName, quantity } = activityData.contributionDetails;
        return `Contributed ${quantity}x ${itemName} to "${activityData.projectName}"`;
      }
      return `Made a contribution to "${activityData.projectName}"`;
    
    case 'status_changed':
      if (activityData.oldStatus && activityData.newStatus) {
        return `Changed "${activityData.projectName}" status from ${activityData.oldStatus} to ${activityData.newStatus}`;
      }
      return `Updated project "${activityData.projectName}"`;
    
    default:
      return `Updated project "${activityData.projectName}"`;
  }
}

/**
 * Log project activities to the database
 */
async function logProjectActivitiesToDatabase(activities: ProjectActivityLogEntry[]): Promise<void> {
  const supabase = createServerClient();
  if (!supabase) {
    console.warn('Supabase client not available, skipping project activity logging');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('user_activity')
      .insert(activities);
    
    if (error) {
      console.error('Error logging project activities to database:', error);
    } else {
      console.log(`✅ Logged ${activities.length} project activities to database`);
    }
    
  } catch (error) {
    console.error('Error inserting project activities:', error);
  }
}

/**
 * Helper function to get settlement member ID from Supabase user
 */
export async function getSettlementMemberFromUser(
  settlementMemberId: string, // BitJita player_entity_id
): Promise<{ memberId: string; memberName: string } | null> {
  const supabase = createServerClient();
  if (!supabase) return null;
  
  try {
    // Try to find existing settlement member using player_entity_id
    const { data: member, error } = await supabase
      .from('settlement_members')
      .select('id, name, player_entity_id')
      .eq('player_entity_id', settlementMemberId)
      .single()
    
    if (error || !member) {
      console.warn(`No settlement member found for user ${settlementMemberId}`);
      return null;
    }
    
    return {
      memberId: member.id,
      memberName: member.name
    };
    
  } catch (error) {
    console.error('Error getting settlement member:', error);
    return null;
  }
}

/**
 * Convenience functions for common project activities
 */
export async function logProjectCreated(
  projectId: string,
  projectName: string,
  projectPriority: number,
  creatorMemberId: string,
  creatorMemberName: string
): Promise<void> {
  await trackProjectActivity({
    memberId: creatorMemberId,
    memberName: creatorMemberName,
    projectId,
    projectName,
    projectPriority,
    action: 'created'
  });
}

export async function logProjectCompleted(
  projectId: string,
  projectName: string,
  projectPriority: number,
  completedByMemberId: string,
  completedByMemberName: string
): Promise<void> {
  await trackProjectActivity({
    memberId: completedByMemberId,
    memberName: completedByMemberName,
    projectId,
    projectName,
    projectPriority,
    action: 'completed'
  });
}

export async function logProjectContribution(
  projectId: string,
  projectName: string,
  projectPriority: number,
  contributorMemberId: string,
  contributorMemberName: string,
  itemName: string,
  quantity: number,
  notes?: string
): Promise<void> {
  await trackProjectActivity({
    memberId: contributorMemberId,
    memberName: contributorMemberName,
    projectId,
    projectName,
    projectPriority,
    action: 'contribution_added',
    contributionDetails: {
      itemName,
      quantity,
      notes
    }
  });
}