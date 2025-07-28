-- =============================================================================
-- Settlement Member Visibility Fix
-- =============================================================================
-- This script fixes the issues where members disappear after sync
-- Run this in your Supabase SQL editor

-- =============================================================================
-- 1. Fix the View - Remove Aggressive Filtering
-- =============================================================================
-- The current view only shows is_active = true members, but our sync
-- might not be setting is_active correctly, or the view logic is wrong

DROP VIEW IF EXISTS settlement_member_details;
CREATE VIEW settlement_member_details AS
SELECT 
    m.settlement_id,
    m.entity_id,
    m.user_name,
    m.inventory_permission,
    m.build_permission,
    m.officer_permission,
    m.co_owner_permission,
    m.last_login_timestamp,
    m.joined_settlement_at,
    m.is_active,
    c.skills,
    c.total_skills,
    c.highest_level,
    c.total_level,
    c.total_xp,
    c.top_profession,
    CASE 
        WHEN m.last_login_timestamp IS NOT NULL AND 
             m.last_login_timestamp > (NOW() - INTERVAL '7 days') 
        THEN true 
        ELSE false 
    END as is_recently_active,
    GREATEST(m.last_synced_at, COALESCE(c.last_synced_at, m.last_synced_at)) as last_synced_at
FROM settlement_members m
LEFT JOIN settlement_citizens c ON m.settlement_id = c.settlement_id AND m.entity_id = c.entity_id;
-- REMOVED: WHERE m.is_active = true (this was hiding members!)

-- =============================================================================
-- 2. Create a Debug View to See All Data
-- =============================================================================
CREATE OR REPLACE VIEW settlement_member_debug AS
SELECT 
    m.settlement_id,
    m.entity_id,
    m.user_name,
    m.is_active,
    m.last_synced_at,
    c.user_name as citizen_name,
    c.top_profession,
    CASE WHEN c.entity_id IS NOT NULL THEN 'has_citizen_data' ELSE 'missing_citizen_data' END as citizen_status
FROM settlement_members m
LEFT JOIN settlement_citizens c ON m.settlement_id = c.settlement_id AND m.entity_id = c.entity_id
ORDER BY m.last_synced_at DESC;

-- =============================================================================
-- 3. Check Current Data Status
-- =============================================================================
-- Run these queries to debug:

-- Count all members by settlement:
-- SELECT settlement_id, COUNT(*) as total_members, 
--        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_members
-- FROM settlement_members 
-- GROUP BY settlement_id;

-- Check if data exists:
-- SELECT COUNT(*) FROM settlement_members WHERE settlement_id = '504403158277057776';
-- SELECT COUNT(*) FROM settlement_citizens WHERE settlement_id = '504403158277057776';
-- SELECT COUNT(*) FROM settlement_member_details WHERE settlement_id = '504403158277057776';

-- See sample data:
-- SELECT * FROM settlement_member_debug WHERE settlement_id = '504403158277057776' LIMIT 10;

-- =============================================================================
-- 4. Fix Data Consistency Issues
-- =============================================================================
-- Ensure all synced members are marked as active
UPDATE settlement_members 
SET is_active = true 
WHERE last_synced_at > (NOW() - INTERVAL '1 hour');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- After running this script, check these in Supabase SQL editor:

-- 1. Total member count:
-- SELECT settlement_id, COUNT(*) FROM settlement_member_details 
-- WHERE settlement_id = '504403158277057776' GROUP BY settlement_id;

-- 2. Active vs inactive:
-- SELECT is_active, COUNT(*) FROM settlement_members 
-- WHERE settlement_id = '504403158277057776' GROUP BY is_active;

-- 3. Recent sync data:
-- SELECT COUNT(*) FROM settlement_members 
-- WHERE settlement_id = '504403158277057776' 
-- AND last_synced_at > (NOW() - INTERVAL '1 hour');

-- =============================================================================
-- SETUP COMPLETE! 🎉
-- ============================================================================= 