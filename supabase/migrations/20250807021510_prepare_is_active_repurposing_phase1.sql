-- Phase 1: Prepare for is_active repurposing
-- Create database views and utility functions to separate settlement membership from activity
-- This allows us to test the new architecture before making breaking changes

-- ================================================================
-- UTILITY FUNCTIONS
-- ================================================================

-- Function to check if a member is recently active (logged in last 7 days)
CREATE OR REPLACE FUNCTION is_recently_active(last_login_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
  -- Handle null timestamps
  IF last_login_timestamp IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if login was within last 7 days
  RETURN last_login_timestamp > (NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get activity status string
CREATE OR REPLACE FUNCTION get_activity_status(last_login_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
  IF last_login_timestamp IS NULL THEN
    RETURN 'never_logged_in';
  END IF;
  
  IF last_login_timestamp > (NOW() - INTERVAL '1 day') THEN
    RETURN 'very_active';
  ELSIF last_login_timestamp > (NOW() - INTERVAL '3 days') THEN
    RETURN 'active';
  ELSIF last_login_timestamp > (NOW() - INTERVAL '7 days') THEN
    RETURN 'recently_active';
  ELSIF last_login_timestamp > (NOW() - INTERVAL '30 days') THEN
    RETURN 'inactive';
  ELSE
    RETURN 'very_inactive';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================================
-- DATABASE VIEWS
-- ================================================================

-- View 1: Active Settlement Members (current is_active = true)
-- This will remain the same after repurposing, but semantics will change
CREATE VIEW settlement_members_active AS 
SELECT 
  *,
  is_recently_active(last_login_timestamp) as recently_active,
  get_activity_status(last_login_timestamp) as activity_status
FROM settlement_members 
WHERE is_active = true;

-- View 2: All members with computed activity fields
-- This provides both settlement membership and activity info
CREATE VIEW settlement_members_with_activity AS 
SELECT 
  *,
  is_recently_active(last_login_timestamp) as recently_active,
  get_activity_status(last_login_timestamp) as activity_status,
  -- Days since last login (useful for sorting/filtering)
  CASE 
    WHEN last_login_timestamp IS NULL THEN NULL
    ELSE EXTRACT(DAYS FROM (NOW() - last_login_timestamp))::INTEGER
  END as days_since_login
FROM settlement_members;

-- View 3: Recently active members (for dashboard/analytics)
-- Members who are in settlement AND logged in recently
CREATE VIEW settlement_members_recently_active AS 
SELECT * FROM settlement_members_with_activity
WHERE is_active = true 
AND recently_active = true;

-- View 4: Analytics-friendly member view
-- Pre-computed stats for faster dashboard queries
CREATE VIEW settlement_members_analytics AS 
SELECT 
  settlement_id,
  COUNT(*) as total_members,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_members,
  COUNT(CASE WHEN is_active = true AND recently_active = true THEN 1 END) as recently_active_members,
  COUNT(CASE WHEN officer_permission > 0 AND is_active = true THEN 1 END) as officers,
  COUNT(CASE WHEN co_owner_permission > 0 AND is_active = true THEN 1 END) as co_owners,
  COUNT(CASE WHEN supabase_user_id IS NOT NULL AND is_active = true THEN 1 END) as claimed_members,
  AVG(total_skills) FILTER (WHERE is_active = true) as avg_skills,
  MAX(highest_level) FILTER (WHERE is_active = true) as max_level
FROM settlement_members_with_activity
GROUP BY settlement_id;

-- ================================================================
-- INDEXES for performance
-- ================================================================

-- Index for activity calculations (if not exists)
CREATE INDEX IF NOT EXISTS idx_settlement_members_last_login_activity 
ON settlement_members(settlement_id, last_login_timestamp DESC) 
WHERE is_active = true;

-- Index for analytics view
CREATE INDEX IF NOT EXISTS idx_settlement_members_permissions_activity 
ON settlement_members(settlement_id, is_active, officer_permission, co_owner_permission, supabase_user_id);

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON FUNCTION is_recently_active(TIMESTAMP WITH TIME ZONE) IS 
'Checks if a member logged in within the last 7 days. Replaces is_active boolean for activity checks.';

COMMENT ON FUNCTION get_activity_status(TIMESTAMP WITH TIME ZONE) IS 
'Returns human-readable activity status based on last login timestamp.';

COMMENT ON VIEW settlement_members_active IS 
'Active settlement members with computed activity fields. Will represent "in settlement" after is_active repurposing.';

COMMENT ON VIEW settlement_members_with_activity IS 
'All members with computed activity fields. Primary view for most member queries.';

COMMENT ON VIEW settlement_members_recently_active IS 
'Members who are both in settlement and recently active. For dashboard "active members" counts.';

COMMENT ON VIEW settlement_members_analytics IS 
'Pre-computed settlement analytics. Optimized for dashboard queries.';
