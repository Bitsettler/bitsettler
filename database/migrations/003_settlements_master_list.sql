-- Migration: 003_settlements_master_list.sql
-- Create master settlements list table for local search
-- Purpose: Cache all settlements from BitJita API to avoid real-time API hits

-- =============================================================================
-- SETTLEMENTS MASTER LIST
-- =============================================================================

-- Master list of all settlements (synced from BitJita API)
CREATE TABLE settlements_master (
    id TEXT PRIMARY KEY,                  -- BitJita settlement ID (entityId)
    name TEXT NOT NULL,                   -- Settlement name
    tier INTEGER DEFAULT 0,              -- Settlement tier
    treasury BIGINT DEFAULT 0,           -- Current treasury balance
    supplies INTEGER DEFAULT 0,          -- Supplies count
    tiles INTEGER DEFAULT 0,             -- Number of tiles
    population INTEGER DEFAULT 0,        -- Population (derived from tiles)
    
    -- Search optimization
    name_normalized TEXT,                 -- Lowercase name for case-insensitive search
    name_searchable TEXT,                 -- Processed name for full-text search
    
    -- Sync metadata
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_source TEXT DEFAULT 'bitjita',  -- Where this data came from
    is_active BOOLEAN DEFAULT true,      -- Whether settlement is still active
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast searching
CREATE INDEX idx_settlements_master_name ON settlements_master(name);
CREATE INDEX idx_settlements_master_name_normalized ON settlements_master(name_normalized);
CREATE INDEX idx_settlements_master_tier ON settlements_master(tier);
CREATE INDEX idx_settlements_master_population ON settlements_master(population DESC);
CREATE INDEX idx_settlements_master_treasury ON settlements_master(treasury DESC);
CREATE INDEX idx_settlements_master_last_synced ON settlements_master(last_synced_at);
CREATE INDEX idx_settlements_master_active ON settlements_master(is_active) WHERE is_active = true;

-- Full-text search index for settlement names
CREATE INDEX idx_settlements_master_search ON settlements_master 
USING gin(to_tsvector('english', name_searchable));

-- =============================================================================
-- SYNC TRACKING
-- =============================================================================

-- Track sync operations for the settlements master list
CREATE TABLE settlements_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type TEXT NOT NULL,             -- 'full_sync', 'incremental', 'search_query'
    settlements_found INTEGER DEFAULT 0,  -- How many settlements were found
    settlements_added INTEGER DEFAULT 0,  -- How many new settlements added
    settlements_updated INTEGER DEFAULT 0, -- How many existing settlements updated
    settlements_deactivated INTEGER DEFAULT 0, -- How many marked as inactive
    sync_duration_ms INTEGER,            -- How long the sync took
    api_calls_made INTEGER DEFAULT 0,    -- Number of BitJita API calls
    
    -- Error tracking
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Metadata
    triggered_by TEXT,                   -- 'cron', 'manual', 'search'
    bitjita_query TEXT,                  -- What query was used (if any)
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for monitoring sync performance
CREATE INDEX idx_settlements_sync_log_started ON settlements_sync_log(started_at DESC);
CREATE INDEX idx_settlements_sync_log_success ON settlements_sync_log(success);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update normalized name fields
CREATE OR REPLACE FUNCTION update_settlement_search_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize name for case-insensitive search
    NEW.name_normalized = LOWER(NEW.name);
    
    -- Create searchable name (remove special chars, extra spaces)
    NEW.name_searchable = regexp_replace(
        regexp_replace(LOWER(NEW.name), '[^a-z0-9\s]', ' ', 'g'),
        '\s+', ' ', 'g'
    );
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search fields
CREATE TRIGGER trigger_update_settlement_search_fields
    BEFORE INSERT OR UPDATE ON settlements_master
    FOR EACH ROW
    EXECUTE FUNCTION update_settlement_search_fields();

-- =============================================================================
-- SAMPLE DATA & COMMENTS
-- =============================================================================

-- This table will be populated by the sync service
-- Expected data pattern:
-- INSERT INTO settlements_master (id, name, tier, treasury, supplies, tiles, population)
-- VALUES ('123456789', 'Port Taverna', 3, 335603, 1240, 45, 45);

COMMENT ON TABLE settlements_master IS 
'Master list of all settlements from BitJita API. Synced every 30 minutes to enable fast local search.';

COMMENT ON COLUMN settlements_master.name_normalized IS 
'Lowercase version of settlement name for case-insensitive searching';

COMMENT ON COLUMN settlements_master.name_searchable IS 
'Processed version of settlement name optimized for full-text search';

COMMENT ON COLUMN settlements_master.last_synced_at IS 
'When this settlement data was last updated from BitJita API';

COMMENT ON TABLE settlements_sync_log IS 
'Tracks all sync operations for monitoring and debugging settlement data imports'; 