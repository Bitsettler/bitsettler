-- Add invite code support to settlements_master table
-- This removes the need for localStorage and makes invite codes persistent server-side

-- First, create settlements_master table if it doesn't exist
CREATE TABLE IF NOT EXISTS settlements_master (
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

-- Create indexes for settlements_master
CREATE INDEX IF NOT EXISTS idx_settlements_master_name ON settlements_master(name);
CREATE INDEX IF NOT EXISTS idx_settlements_master_name_normalized ON settlements_master(name_normalized);
CREATE INDEX IF NOT EXISTS idx_settlements_master_tier ON settlements_master(tier);
CREATE INDEX IF NOT EXISTS idx_settlements_master_population ON settlements_master(population DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_master_treasury ON settlements_master(treasury DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_master_last_synced ON settlements_master(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_settlements_master_active ON settlements_master(is_active) WHERE is_active = true;

-- Add invite code columns to settlements_master
ALTER TABLE settlements_master 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invite_code_generated_by TEXT, -- Settlement member ID who generated it
ADD COLUMN IF NOT EXISTS invite_code_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invite_code_last_regenerated_at TIMESTAMP WITH TIME ZONE;

-- Create unique index on invite_code (excluding NULL values)
CREATE UNIQUE INDEX idx_settlements_master_invite_code 
ON settlements_master(invite_code) 
WHERE invite_code IS NOT NULL;

-- Function to generate a random invite code
CREATE OR REPLACE FUNCTION generate_invite_code() 
RETURNS TEXT AS $$
DECLARE
    letters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    numbers TEXT := '23456789';
    code TEXT := '';
    i INTEGER;
BEGIN
    -- Generate 3 letters
    FOR i IN 1..3 LOOP
        code := code || substr(letters, floor(random() * length(letters) + 1)::integer, 1);
    END LOOP;
    
    -- Generate 3 numbers  
    FOR i IN 1..3 LOOP
        code := code || substr(numbers, floor(random() * length(numbers) + 1)::integer, 1);
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure unique invite code generation
CREATE OR REPLACE FUNCTION generate_unique_invite_code() 
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        new_code := generate_invite_code();
        attempts := attempts + 1;
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM settlements_master WHERE invite_code = new_code) THEN
            RETURN new_code;
        END IF;
        
        -- Prevent infinite loop
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique invite code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invite code for a settlement
CREATE OR REPLACE FUNCTION create_settlement_invite_code(
    p_settlement_id TEXT,
    p_generated_by TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Generate unique code
    new_code := generate_unique_invite_code();
    
    -- Update settlement with new invite code
    UPDATE settlements_master 
    SET 
        invite_code = new_code,
        invite_code_generated_by = p_generated_by,
        invite_code_generated_at = NOW(),
        invite_code_last_regenerated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_settlement_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Settlement with ID % not found', p_settlement_id;
    END IF;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to regenerate invite code for a settlement
CREATE OR REPLACE FUNCTION regenerate_settlement_invite_code(
    p_settlement_id TEXT,
    p_regenerated_by TEXT
) RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Generate unique code
    new_code := generate_unique_invite_code();
    
    -- Update settlement with new invite code
    UPDATE settlements_master 
    SET 
        invite_code = new_code,
        invite_code_generated_by = p_regenerated_by,
        invite_code_last_regenerated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_settlement_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Settlement with ID % not found', p_settlement_id;
    END IF;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_unique_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION create_settlement_invite_code(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_settlement_invite_code(TEXT, TEXT) TO authenticated;
