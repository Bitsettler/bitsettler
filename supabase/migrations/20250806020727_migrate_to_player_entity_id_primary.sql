-- Migration: Switch from entity_id to player_entity_id as primary key
-- Following BitJita developer recommendation for stable player identifiers

-- Since we have no production users, we can do this as a clean migration
-- If there were users, we'd need a more complex data migration strategy

-- 1. Drop the old unique constraint
ALTER TABLE settlement_members DROP CONSTRAINT IF EXISTS settlement_members_settlement_id_entity_id_key;

-- 2. Make entity_id nullable (becomes secondary reference)
ALTER TABLE settlement_members ALTER COLUMN entity_id DROP NOT NULL;

-- 3. Ensure player_entity_id is NOT NULL (primary identifier)
ALTER TABLE settlement_members ALTER COLUMN player_entity_id SET NOT NULL;

-- 4. Add new unique constraint on player_entity_id (stable player identifier)
ALTER TABLE settlement_members ADD CONSTRAINT settlement_members_settlement_id_player_entity_id_key 
  UNIQUE(settlement_id, player_entity_id);

-- 5. Update comments to reflect the new architecture
COMMENT ON COLUMN settlement_members.player_entity_id IS 'PRIMARY: BitJita player character ID - stable, recommended by devs, never changes';
COMMENT ON COLUMN settlement_members.entity_id IS 'SECONDARY: Generic BitJita entity ID - can be reused for different game objects';
COMMENT ON COLUMN settlement_members.claim_entity_id IS 'BitJita settlement/territory claim ID';

-- 6. Create index for performance on new primary key
CREATE INDEX IF NOT EXISTS idx_settlement_members_player_entity_id ON settlement_members(player_entity_id);

-- Note: This migration assumes no production data exists
-- If migrating with existing data, additional steps would be needed:
-- - Verify all existing records have player_entity_id populated
-- - Handle any duplicate player_entity_id conflicts
-- - Update foreign key references in related tables
