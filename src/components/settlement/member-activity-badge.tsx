/**
 * Member Activity Badge Component
 * 
 * Demonstrates the new activity calculation approach.
 * Shows both settlement membership status and activity level.
 * 
 * Phase 1: Use alongside existing activity displays
 * Phase 2: Replace existing activity badges
 */

import { Badge } from '@/components/ui/badge';
import { getMemberActivityInfo, getActivityStatusText, getActivityStatusColor, formatLastLogin } from '@/lib/utils/member-activity';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Users, UserCheck, UserX } from 'lucide-react';

interface MemberActivityBadgeProps {
  member: {
    last_login_timestamp?: string | null;
    is_active?: boolean;
    name: string;
  };
  showSettlementStatus?: boolean;  // Show settlement membership
  showActivityStatus?: boolean;    // Show login activity
  variant?: 'compact' | 'detailed';
}

export function MemberActivityBadge({ 
  member, 
  showSettlementStatus = true,
  showActivityStatus = true,
  variant = 'compact'
}: MemberActivityBadgeProps) {
  const activityInfo = getMemberActivityInfo(member);
  
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {/* Settlement Status Badge */}
          {showSettlementStatus && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={activityInfo.isInSettlement ? 'default' : 'secondary'} className="gap-1">
                  {activityInfo.isInSettlement ? (
                    <Users className="h-3 w-3" />
                  ) : (
                    <UserX className="h-3 w-3" />
                  )}
                  {activityInfo.isInSettlement ? 'Member' : 'Former'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{member.name} is {activityInfo.isInSettlement ? 'currently in' : 'no longer in'} the settlement</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Activity Status Badge */}
          {showActivityStatus && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={activityInfo.isRecentlyActive ? 'default' : 'secondary'} 
                  className={`gap-1 ${getActivityStatusColor(activityInfo.activityStatus)}`}
                >
                  <Clock className="h-3 w-3" />
                  {activityInfo.isRecentlyActive ? 'Active' : 'Inactive'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{getActivityStatusText(activityInfo.activityStatus)}</p>
                  <p className="text-sm">{formatLastLogin(member.last_login_timestamp)}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Detailed variant
  return (
    <div className="space-y-2">
      {/* Settlement Status */}
      {showSettlementStatus && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {activityInfo.isInSettlement ? (
              <UserCheck className="h-4 w-4 text-green-600" />
            ) : (
              <UserX className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium">
              {activityInfo.isInSettlement ? 'Settlement Member' : 'Former Member'}
            </span>
          </div>
        </div>
      )}
      
      {/* Activity Status */}
      {showActivityStatus && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className={getActivityStatusColor(activityInfo.activityStatus)}>
                {getActivityStatusText(activityInfo.activityStatus)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatLastLogin(member.last_login_timestamp)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple activity status display for tables
 */
export function ActivityStatusCell({ member }: { member: { last_login_timestamp?: string | null } }) {
  const activityInfo = getMemberActivityInfo(member);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-center">
            <Badge className={getActivityStatusColor(activityInfo.activityStatus)}>
              {getActivityStatusText(activityInfo.activityStatus)}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{formatLastLogin(member.last_login_timestamp)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Member count badges that separate settlement vs activity
 */
export function MemberCountBadges({ 
  members 
}: { 
  members: Array<{ last_login_timestamp?: string | null; is_active?: boolean }> 
}) {
  const settlementMembers = members.filter(m => m.is_active === true);
  const recentlyActiveMembers = members.filter(m => {
    const info = getMemberActivityInfo(m);
    return info.isInSettlement && info.isRecentlyActive;
  });
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1">
        <Users className="h-3 w-3" />
        {settlementMembers.length} In Settlement
      </Badge>
      <Badge variant="outline" className="gap-1">
        <UserCheck className="h-3 w-3" />
        {recentlyActiveMembers.length} Recently Active
      </Badge>
    </div>
  );
}
