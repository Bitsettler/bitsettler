-- Migration: 004_settlement_members_cache.sql
-- Create tables to cache settlement member and citizen data from BitJita API
-- Purpose: Avoid real-time API hits by polling and caching member data locally

-- Settlement members roster cache
CREATE TABLE settlement_members (
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

-- Settlement citizens skills cache
CREATE TABLE settlement_citizens (
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

-- Indexes for performance
CREATE INDEX idx_settlement_members_settlement_id ON settlement_members(settlement_id);
CREATE INDEX idx_settlement_members_user_name ON settlement_members(user_name);
CREATE INDEX idx_settlement_members_active ON settlement_members(is_active) WHERE is_active = true;
CREATE INDEX idx_settlement_members_last_login ON settlement_members(last_login_timestamp DESC);
CREATE INDEX idx_settlement_members_permissions ON settlement_members(officer_permission, co_owner_permission);
CREATE INDEX idx_settlement_members_last_synced ON settlement_members(last_synced_at);

CREATE INDEX idx_settlement_citizens_settlement_id ON settlement_citizens(settlement_id);
CREATE INDEX idx_settlement_citizens_user_name ON settlement_citizens(user_name);
CREATE INDEX idx_settlement_citizens_profession ON settlement_citizens(top_profession);
CREATE INDEX idx_settlement_citizens_total_level ON settlement_citizens(total_level DESC);
CREATE INDEX idx_settlement_citizens_total_xp ON settlement_citizens(total_xp DESC);
CREATE INDEX idx_settlement_citizens_last_synced ON settlement_citizens(last_synced_at);

-- Settlement member sync log
CREATE TABLE settlement_member_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id TEXT NOT NULL,
    settlement_name TEXT,
    sync_type TEXT NOT NULL, -- 'full_roster', 'full_citizens', 'incremental'
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

CREATE INDEX idx_settlement_member_sync_log_settlement ON settlement_member_sync_log(settlement_id);
CREATE INDEX idx_settlement_member_sync_log_started ON settlement_member_sync_log(started_at DESC);
CREATE INDEX idx_settlement_member_sync_log_success ON settlement_member_sync_log(success);

-- Function to update top profession from skills
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

CREATE TRIGGER trigger_update_citizen_top_profession
    BEFORE INSERT OR UPDATE ON settlement_citizens
    FOR EACH ROW
    EXECUTE FUNCTION update_citizen_top_profession();

-- View to join members and citizens data
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