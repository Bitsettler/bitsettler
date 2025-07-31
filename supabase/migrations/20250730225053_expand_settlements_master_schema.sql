-- Expand settlements_master to store all rich data from BitJita API
-- Since we're already fetching the data, might as well store it for future features

-- Add all the additional fields from BitJita API
ALTER TABLE settlements_master 
ADD COLUMN IF NOT EXISTS building_maintenance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS location_x INTEGER,
ADD COLUMN IF NOT EXISTS location_z INTEGER, 
ADD COLUMN IF NOT EXISTS location_dimension INTEGER,
ADD COLUMN IF NOT EXISTS region_id INTEGER,
ADD COLUMN IF NOT EXISTS region_name TEXT,
ADD COLUMN IF NOT EXISTS owner_player_entity_id TEXT,
ADD COLUMN IF NOT EXISTS owner_building_entity_id TEXT,
ADD COLUMN IF NOT EXISTS neutral BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS learned_techs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS researching INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS research_start_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bitjita_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bitjita_updated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for the new searchable/filterable fields
CREATE INDEX IF NOT EXISTS idx_settlements_master_region_id ON settlements_master(region_id);
CREATE INDEX IF NOT EXISTS idx_settlements_master_region_name ON settlements_master(region_name);
CREATE INDEX IF NOT EXISTS idx_settlements_master_location ON settlements_master(location_x, location_z);
CREATE INDEX IF NOT EXISTS idx_settlements_master_owner ON settlements_master(owner_player_entity_id);
CREATE INDEX IF NOT EXISTS idx_settlements_master_neutral ON settlements_master(neutral);
CREATE INDEX IF NOT EXISTS idx_settlements_master_researching ON settlements_master(researching) WHERE researching > 0;

-- Add helpful comments explaining the new fields
COMMENT ON COLUMN settlements_master.building_maintenance IS 'Cost to maintain settlement buildings (from BitJita)';
COMMENT ON COLUMN settlements_master.location_x IS 'Settlement X coordinate in game world';
COMMENT ON COLUMN settlements_master.location_z IS 'Settlement Z coordinate in game world';
COMMENT ON COLUMN settlements_master.location_dimension IS 'Which dimension/world layer the settlement is in';
COMMENT ON COLUMN settlements_master.region_id IS 'BitJita region ID (e.g. 9 for Zepharel)';
COMMENT ON COLUMN settlements_master.region_name IS 'Human-readable region name (e.g. "Zepharel")';
COMMENT ON COLUMN settlements_master.owner_player_entity_id IS 'BitJita entity ID of settlement owner';
COMMENT ON COLUMN settlements_master.owner_building_entity_id IS 'BitJita entity ID of owner building';
COMMENT ON COLUMN settlements_master.neutral IS 'Whether settlement is neutral (not player-owned)';
COMMENT ON COLUMN settlements_master.learned_techs IS 'Array of learned technology IDs from BitJita';
COMMENT ON COLUMN settlements_master.researching IS 'Currently researching technology ID (0 = none)';
COMMENT ON COLUMN settlements_master.research_start_timestamp IS 'When current research started';
COMMENT ON COLUMN settlements_master.bitjita_created_at IS 'Settlement creation time from BitJita';
COMMENT ON COLUMN settlements_master.bitjita_updated_at IS 'Last update time from BitJita';

-- Update our transformation logic to use all fields
COMMENT ON TABLE settlements_master IS 'Master list of all settlements with complete BitJita data for fast local search and future features';
