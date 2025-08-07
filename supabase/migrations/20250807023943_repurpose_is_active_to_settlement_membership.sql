-- Phase 2: Repurpose is_active from "7-day login activity" to "currently in settlement"
-- This is the atomic change that switches the semantics of the is_active field

-- ================================================================
-- UPDATE COMMENTS TO REFLECT NEW SEMANTICS
-- ================================================================

-- Update table comment
COMMENT ON COLUMN settlement_members.is_active IS 
'REPURPOSED: Now indicates if member is currently in settlement (from BitJita API). 
Use last_login_timestamp and utility functions for activity calculations.
Historical note: Previously indicated 7-day login activity.';

-- Update view comments
COMMENT ON VIEW settlement_members_active IS 
'Members currently in settlement (is_active = true). Post-repurposing: settlement membership, not login activity.';

COMMENT ON VIEW settlement_members_with_activity IS 
'All members with computed activity fields. Primary view for queries that need both settlement membership and login activity.';

-- ================================================================
-- UPDATE EXISTING RLS POLICIES (if needed)
-- ================================================================

-- Note: Most RLS policies using is_active = true are actually correct
-- because they want to restrict access to current settlement members,
-- which is exactly what is_active now represents.

-- Example: Policies that check "is_active = true AND officer_permission > 0"
-- are correct because they want current settlement members with officer permissions.

-- ================================================================
-- ADD INDEXES FOR NEW USAGE PATTERNS
-- ================================================================

-- Index for "recently active settlement members" queries
-- This combination will be common: members in settlement who also logged in recently
CREATE INDEX IF NOT EXISTS idx_settlement_members_active_with_recent_login 
ON settlement_members(settlement_id, is_active, last_login_timestamp DESC) 
WHERE is_active = true;

-- ================================================================
-- CREATE HELPER VIEWS FOR COMMON QUERIES
-- ================================================================

-- View for "active members who also logged in recently"
-- This replaces the old is_active = true queries that wanted login activity
CREATE VIEW settlement_members_in_settlement_and_recently_active AS 
SELECT 
  sm.*,
  sma.recently_active,
  sma.activity_status,
  sma.days_since_login
FROM settlement_members sm
JOIN settlement_members_with_activity sma ON sm.id = sma.id
WHERE sm.is_active = true  -- In settlement
AND sma.recently_active = true;  -- Logged in last 7 days

COMMENT ON VIEW settlement_members_in_settlement_and_recently_active IS 
'Members who are both currently in settlement AND have logged in within the last 7 days. 
Use this for UI that previously filtered by is_active = true when they meant login activity.';

-- ================================================================
-- ANALYTICS AND MIGRATION VERIFICATION
-- ================================================================

-- Create a temporary view to help verify the migration worked correctly
CREATE VIEW migration_verification_member_counts AS
SELECT 
  settlement_id,
  COUNT(*) as total_members_in_db,
  COUNT(CASE WHEN is_active = true THEN 1 END) as current_settlement_members,
  COUNT(CASE WHEN is_active = false THEN 1 END) as former_members,
  COUNT(CASE WHEN is_recently_active(last_login_timestamp) = true AND is_active = true THEN 1 END) as in_settlement_and_recently_active,
  COUNT(CASE WHEN is_recently_active(last_login_timestamp) = false AND is_active = true THEN 1 END) as in_settlement_but_inactive
FROM settlement_members_with_activity
GROUP BY settlement_id;

COMMENT ON VIEW migration_verification_member_counts IS 
'Temporary view to verify is_active repurposing worked correctly. 
current_settlement_members should match BitJita API counts.
Drop this view after migration verification.';

-- ================================================================
-- NOTIFICATIONS AND LOGGING
-- ================================================================

-- Log the migration completion
DO $$
BEGIN
  -- Create a record that this migration ran
  -- This helps with debugging if issues arise
  RAISE NOTICE 'is_active field has been repurposed from "7-day login activity" to "currently in settlement"';
  RAISE NOTICE 'Use last_login_timestamp and utility functions for activity calculations';
  RAISE NOTICE 'Existing RLS policies should mostly work correctly with new semantics';
END $$;
