/**
 * Member Activity Utilities
 * 
 * Centralized functions for calculating member activity status.
 * These replace the is_active boolean checks with proper timestamp-based calculations.
 * 
 * Phase 1: Use alongside existing is_active checks
 * Phase 2: Replace is_active checks entirely
 */

export type ActivityStatus = 
  | 'very_active'      // Last 1 day
  | 'active'           // Last 3 days  
  | 'recently_active'  // Last 7 days
  | 'inactive'         // Last 30 days
  | 'very_inactive'    // 30+ days ago
  | 'never_logged_in'; // Never or null

export interface MemberActivityInfo {
  isRecentlyActive: boolean;        // Logged in last 7 days (replaces is_active for activity)
  activityStatus: ActivityStatus;   // Detailed activity level
  daysSinceLogin: number | null;    // Days since last login (null if never)
  isInSettlement: boolean;          // Currently in settlement (will be is_active after repurposing)
}

/**
 * Check if a member is recently active (logged in last 7 days)
 * This replaces checks like `member.is_active === true` for activity
 */
export function isRecentlyActive(lastLoginTimestamp: string | null | undefined): boolean {
  if (!lastLoginTimestamp) return false;
  
  const loginDate = new Date(lastLoginTimestamp);
  if (isNaN(loginDate.getTime())) return false;
  
  const daysSinceLogin = (Date.now() - loginDate.getTime()) / (24 * 60 * 60 * 1000);
  
  // Sanity check: if login is in future or impossibly old, return false
  if (daysSinceLogin < 0 || daysSinceLogin > 365) return false;
  
  return daysSinceLogin < 7;
}

/**
 * Get detailed activity status based on last login
 */
export function getActivityStatus(lastLoginTimestamp: string | null | undefined): ActivityStatus {
  if (!lastLoginTimestamp) return 'never_logged_in';
  
  const loginDate = new Date(lastLoginTimestamp);
  if (isNaN(loginDate.getTime())) return 'never_logged_in';
  
  const daysSinceLogin = (Date.now() - loginDate.getTime()) / (24 * 60 * 60 * 1000);
  
  // Sanity check
  if (daysSinceLogin < 0 || daysSinceLogin > 365) return 'very_inactive';
  
  if (daysSinceLogin <= 1) return 'very_active';
  if (daysSinceLogin <= 3) return 'active';
  if (daysSinceLogin <= 7) return 'recently_active';
  if (daysSinceLogin <= 30) return 'inactive';
  return 'very_inactive';
}

/**
 * Calculate days since last login
 */
export function getDaysSinceLogin(lastLoginTimestamp: string | null | undefined): number | null {
  if (!lastLoginTimestamp) return null;
  
  const loginDate = new Date(lastLoginTimestamp);
  if (isNaN(loginDate.getTime())) return null;
  
  const daysSinceLogin = (Date.now() - loginDate.getTime()) / (24 * 60 * 60 * 1000);
  
  // Sanity check
  if (daysSinceLogin < 0 || daysSinceLogin > 365) return null;
  
  return Math.floor(daysSinceLogin);
}

/**
 * Get comprehensive activity info for a member
 * This is the main function to use for member activity analysis
 */
export function getMemberActivityInfo(member: {
  last_login_timestamp?: string | null;
  is_active?: boolean;
}): MemberActivityInfo {
  return {
    isRecentlyActive: isRecentlyActive(member.last_login_timestamp),
    activityStatus: getActivityStatus(member.last_login_timestamp),
    daysSinceLogin: getDaysSinceLogin(member.last_login_timestamp),
    isInSettlement: member.is_active === true, // Current semantics, will change in Phase 2
  };
}

/**
 * Get activity status display text
 */
export function getActivityStatusText(status: ActivityStatus): string {
  const statusText = {
    very_active: 'Very Active',
    active: 'Active', 
    recently_active: 'Recently Active',
    inactive: 'Inactive',
    very_inactive: 'Very Inactive',
    never_logged_in: 'Never Logged In'
  };
  
  return statusText[status];
}

/**
 * Get activity status color for UI badges
 */
export function getActivityStatusColor(status: ActivityStatus): string {
  const statusColors = {
    very_active: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-700',
    recently_active: 'bg-yellow-100 text-yellow-800', 
    inactive: 'bg-gray-100 text-gray-600',
    very_inactive: 'bg-red-100 text-red-600',
    never_logged_in: 'bg-gray-100 text-gray-500'
  };
  
  return statusColors[status];
}

/**
 * Format time ago string for last login
 */
export function formatLastLogin(lastLoginTimestamp: string | null | undefined): string {
  if (!lastLoginTimestamp) return 'Never logged in';
  
  const loginDate = new Date(lastLoginTimestamp);
  if (isNaN(loginDate.getTime())) return 'Invalid date';
  
  const daysSince = getDaysSinceLogin(lastLoginTimestamp);
  if (daysSince === null) return 'Invalid date';
  
  if (daysSince === 0) return 'Today';
  if (daysSince === 1) return '1 day ago';
  if (daysSince < 7) return `${daysSince} days ago`;
  if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`;
  if (daysSince < 365) return `${Math.floor(daysSince / 30)} months ago`;
  return 'Over a year ago';
}

/**
 * Filter members by activity status
 */
export function filterMembersByActivity<T extends { last_login_timestamp?: string | null }>(
  members: T[],
  filter: 'all' | 'recently_active' | 'inactive' | 'never_logged_in'
): T[] {
  if (filter === 'all') return members;
  
  return members.filter(member => {
    const status = getActivityStatus(member.last_login_timestamp);
    
    switch (filter) {
      case 'recently_active':
        return ['very_active', 'active', 'recently_active'].includes(status);
      case 'inactive':
        return ['inactive', 'very_inactive'].includes(status);
      case 'never_logged_in':
        return status === 'never_logged_in';
      default:
        return true;
    }
  });
}
