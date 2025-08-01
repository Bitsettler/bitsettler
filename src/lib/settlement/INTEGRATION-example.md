# Integration with Sync Process

## How to Add Activity Tracking to Existing Sync

In `sync-settlement-members.ts`, add this code:

```typescript
import { trackMemberActivity, detectSkillChanges } from './activity-tracker';
import { useSkillNames } from '@/hooks/use-skill-names';

// Inside the sync loop, after updating each member:
for (const user of users) {
  // ... existing sync code ...
  
  // DETECT SKILL CHANGES
  const existingMember = await getExistingMember(user.entityId);
  const oldSkills = existingMember?.skills || {};
  const newSkills = user.skills;
  
  // Get skill name mappings
  const { getSkillName } = useSkillNames();
  const skillNameMap = {}; // Build this from skill_names table
  
  const skillChanges = detectSkillChanges(oldSkills, newSkills, skillNameMap);
  
  if (skillChanges.length > 0) {
    // TRACK ACTIVITIES
    await trackMemberActivity({
      memberId: memberData.id,
      memberName: user.userName,
      settlementId: options.settlementId,
      skillChanges,
      totalLevel: user.totalLevel,
      skillCount: Object.keys(newSkills).length
    });
  }
  
  // ... continue with existing sync code ...
}
```

## API Endpoint for Recent Activities

Create `/api/settlement/recent-activities/route.ts`:

```typescript
import { getRecentMemberActivities } from '@/lib/settlement/activity-tracker';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const settlementId = searchParams.get('settlementId');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  if (!settlementId) {
    return Response.json({ error: 'Settlement ID required' }, { status: 400 });
  }
  
  const activities = await getRecentMemberActivities(settlementId, limit);
  
  return Response.json({ 
    success: true, 
    activities,
    count: activities.length 
  });
}
```

## Dashboard Integration

In `settlement-dashboard-view.tsx`:

```typescript
// Add state for activities
const [recentActivities, setRecentActivities] = useState([]);

// Fetch activities
const fetchRecentActivities = useCallback(async () => {
  if (!settlementId) return;
  
  const response = await fetch(`/api/settlement/recent-activities?settlementId=${settlementId}&limit=10`);
  const data = await response.json();
  
  if (data.success) {
    setRecentActivities(data.activities);
  }
}, [settlementId]);

// Update the Recent Member Activity card:
<CardContent>
  {recentActivities.length > 0 ? (
    <div className="space-y-3">
      {recentActivities.map(activity => (
        <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="text-lg">{activity.activity_data.icon || '🎯'}</div>
          <div className="flex-1">
            <div className="font-medium">{activity.activity_data.eventName}</div>
            <div className="text-sm text-muted-foreground">
              {activity.settlement_members.name} • {activity.activity_data.skillName} Level {activity.activity_data.newLevel}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8">
      <div className="text-lg font-medium text-muted-foreground mb-2">No Recent Activity</div>
      <p className="text-sm text-muted-foreground">
        Member achievements and level-ups will appear here.
      </p>
    </div>
  )}
</CardContent>
```