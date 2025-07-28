-- =============================================================================
-- Settlement Member System - Database Setup
-- =============================================================================
-- Run this entire script in your Supabase SQL editor to fix member loading
-- Go to: https://supabase.com/dashboard/project/[your-project]/sql/new

-- =============================================================================
-- 1. Create Settlement Members Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS settlement_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    claim_entity_id TEXT,
    player_entity_id TEXT,
    user_name TEXT NOT NULL,
    inventory_permission INTEGER DEFAULT 0,
    build_permission INTEGER DEFAULT 0,
    officer_permission INTEGER DEFAULT 0,
    co_owner_permission INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login_timestamp TIMESTAMP WITH TIME ZONE,
    joined_settlement_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_source TEXT DEFAULT 'bitjita',
    UNIQUE(settlement_id, entity_id)
);

-- =============================================================================
-- 2. Create Settlement Citizens Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS settlement_citizens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    skills JSONB DEFAULT '{}',
    total_skills INTEGER DEFAULT 0,
    highest_level INTEGER DEFAULT 0,
    total_level INTEGER DEFAULT 0,
    total_xp BIGINT DEFAULT 0,
    top_profession TEXT,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_source TEXT DEFAULT 'bitjita',
    UNIQUE(settlement_id, entity_id)
);

-- =============================================================================
-- 3. Create Sync Log Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS settlement_member_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id TEXT NOT NULL,
    settlement_name TEXT,
    sync_type TEXT NOT NULL,
    members_found INTEGER DEFAULT 0,
    members_added INTEGER DEFAULT 0,
    members_updated INTEGER DEFAULT 0,
    members_deactivated INTEGER DEFAULT 0,
    citizens_found INTEGER DEFAULT 0,
    citizens_added INTEGER DEFAULT 0,
    citizens_updated INTEGER DEFAULT 0,
    sync_duration_ms INTEGER,
    api_calls_made INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    triggered_by TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 4. Create Indexes for Performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_settlement_members_settlement_id ON settlement_members(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_members_user_name ON settlement_members(user_name);
CREATE INDEX IF NOT EXISTS idx_settlement_members_active ON settlement_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_settlement_members_last_login ON settlement_members(last_login_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_settlement_members_permissions ON settlement_members(officer_permission, co_owner_permission);
CREATE INDEX IF NOT EXISTS idx_settlement_members_last_synced ON settlement_members(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_settlement_citizens_settlement_id ON settlement_citizens(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_citizens_user_name ON settlement_citizens(user_name);
CREATE INDEX IF NOT EXISTS idx_settlement_citizens_profession ON settlement_citizens(top_profession);
CREATE INDEX IF NOT EXISTS idx_settlement_citizens_total_level ON settlement_citizens(total_level DESC);
CREATE INDEX IF NOT EXISTS idx_settlement_citizens_total_xp ON settlement_citizens(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_settlement_citizens_last_synced ON settlement_citizens(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_settlement_member_sync_log_settlement ON settlement_member_sync_log(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_member_sync_log_started ON settlement_member_sync_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_settlement_member_sync_log_success ON settlement_member_sync_log(success);

-- =============================================================================
-- 5. Create Function to Update Top Profession
-- =============================================================================
CREATE OR REPLACE FUNCTION update_citizen_top_profession()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate top profession from skills JSONB
    IF NEW.skills IS NOT NULL AND NEW.skills != '{}' THEN
        SELECT key INTO NEW.top_profession
        FROM jsonb_each_text(NEW.skills)
        ORDER BY value::integer DESC
        LIMIT 1;
    ELSE
        NEW.top_profession = 'Unknown';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. Create Trigger for Top Profession Updates
-- =============================================================================
DROP TRIGGER IF EXISTS trigger_update_citizen_top_profession ON settlement_citizens;
CREATE TRIGGER trigger_update_citizen_top_profession
    BEFORE INSERT OR UPDATE ON settlement_citizens
    FOR EACH ROW
    EXECUTE FUNCTION update_citizen_top_profession();

-- =============================================================================
-- 7. Create Settlement Member Details View (THIS IS THE MISSING PIECE!)
-- =============================================================================
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
    GREATEST(m.last_synced_at, c.last_synced_at) as last_synced_at
FROM settlement_members m
LEFT JOIN settlement_citizens c ON m.settlement_id = c.settlement_id AND m.entity_id = c.entity_id
WHERE m.is_active = true;

-- =============================================================================
-- 8. Verify Setup (Optional - Check These)
-- =============================================================================
-- Check if tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
-- AND table_name IN ('settlement_members', 'settlement_citizens', 'settlement_member_sync_log');

-- Check if view exists:
-- SELECT table_name FROM information_schema.views WHERE table_schema = 'public' 
-- AND table_name = 'settlement_member_details';

-- Test the view (should return empty result but no error):
-- SELECT COUNT(*) FROM settlement_member_details;

-- =============================================================================
-- SETUP COMPLETE! 🎉
-- =============================================================================
-- After running this script:
-- 1. All required tables and views will be created
-- 2. Your settlement member loading should work
-- 3. Test by running sync and checking the dashboard
-- ============================================================================= 