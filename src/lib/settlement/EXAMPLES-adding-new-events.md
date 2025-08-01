# How to Add New Activity Events

## Quick Examples

### 1. Add a New Skill Milestone
```typescript
// Add to ACTIVITY_EVENTS array in activity-events-config.ts
{
  id: 'carpentry_expert',
  type: 'skill_milestone',
  name: 'Master Carpenter',
  description: 'Reached level 30 in Carpentry',
  condition: {
    trigger: 'skill_change',
    criteria: {
      skillIds: ['Carpentry'],  // Only for Carpentry
      levelThresholds: [30]     // At level 30
    }
  },
  priority: 'medium',
  icon: '🪚',
  color: 'brown'
}
```

### 2. Add a Level Interval Event
```typescript
{
  id: 'mining_every_10_levels',
  type: 'skill_milestone', 
  name: 'Mining Dedication',
  description: 'Another 10 levels in Mining!',
  condition: {
    trigger: 'skill_change',
    criteria: {
      skillIds: ['Mining'],
      levelMultiples: 10,      // Every 10 levels
      minimumLevel: 10         // Starting from level 10
    }
  },
  priority: 'low',
  icon: '⛏️'
}
```

### 3. Add Settlement-Wide Achievement
```typescript
{
  id: 'first_scholar_50',
  type: 'skill_first',
  name: 'Settlement Sage',
  description: 'First to reach level 50 in Scholar',
  condition: {
    trigger: 'skill_change',
    criteria: {
      skillIds: ['Scholar'],
      levelThresholds: [50],
      isFirst: true           // Must be first in settlement
    }
  },
  priority: 'high',
  icon: '📚',
  color: 'purple',
  oneTime: true             // Only happens once
}
```

### 4. Add Member Total Achievement
```typescript
{
  id: 'total_level_500',
  type: 'member_achievement',
  name: 'Settlement Veteran',
  description: 'Reached 500 total skill levels',
  condition: {
    trigger: 'skill_change',
    criteria: {
      totalLevelThreshold: 500  // Based on sum of all skills
    }
  },
  priority: 'high',
  icon: '🏛️',
  color: 'gold'
}
```

### 5. Add Skill Diversity Achievement
```typescript
{
  id: 'all_profession_skills',
  type: 'member_achievement',
  name: 'Renaissance Citizen',
  description: 'Has levels in all 12 profession skills',
  condition: {
    trigger: 'skill_change',
    criteria: {
      skillCountThreshold: 12  // Based on number of different skills
    }
  },
  priority: 'high',
  icon: '🎨',
  color: 'rainbow'
}
```

## Future Ideas You Could Add

### Seasonal/Themed Events
```typescript
{
  id: 'winter_farming_milestone',
  type: 'skill_milestone',
  name: 'Winter Farmer',
  description: 'Reached level 20 in Farming during winter season',
  // Would need custom logic for seasonal checking
}
```

### Speed Achievements
```typescript
{
  id: 'fast_learner',
  type: 'member_achievement', 
  name: 'Fast Learner',
  description: 'Gained 10 levels in one day',
  // Would need time-based tracking
}
```

### Social Achievements
```typescript
{
  id: 'helpful_member',
  type: 'member_achievement',
  name: 'Helpful Citizen', 
  description: 'Contributed to 5 different projects',
  // Would need project participation tracking
}
```

### Settlement Milestones
```typescript
{
  id: 'settlement_avg_level_25',
  type: 'settlement_milestone',
  name: 'Skilled Settlement',
  description: 'Settlement average skill level reached 25',
  // Would need settlement-wide calculations
}
```

## Types of Triggers You Can Use

- **skill_change**: When any skill level changes
- **member_join**: When someone joins the settlement  
- **custom_check**: For complex logic (would need custom functions)

## Condition Types

- **levelThresholds**: `[10, 25, 50]` - Trigger at these exact levels
- **levelMultiples**: `5` - Trigger every 5 levels (5, 10, 15, 20...)
- **skillIds**: `['Mining', 'Smithing']` - Only for specific skills
- **isFirst**: `true` - Must be first in settlement to achieve this
- **minimumLevel**: `10` - Only trigger above this level
- **totalLevelThreshold**: `100` - Based on sum of all member's skills
- **skillCountThreshold**: `8` - Based on number of different skills

## How to Test New Events

1. Add your event to the config
2. Trigger a member sync to test
3. Check the `user_activity` table for new entries
4. View in dashboard "Recent Member Activity"

## Tips

- Use descriptive `id` values (they're used for tracking)
- Set appropriate `priority` (affects display prominence)
- Add `oneTime: true` for unique achievements  
- Use relevant `icon` and `color` for visual appeal
- Test with your own character first!