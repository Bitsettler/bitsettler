-- Remove Discord avatar fields from settlement_members table
-- Reverting the Discord avatar integration

-- Drop the index first
DROP INDEX IF EXISTS idx_settlement_members_discord_user_id;

-- Remove Discord avatar columns
ALTER TABLE settlement_members 
DROP COLUMN IF EXISTS discord_user_id,
DROP COLUMN IF EXISTS discord_username,
DROP COLUMN IF EXISTS discord_global_name,
DROP COLUMN IF EXISTS discord_avatar_hash,
DROP COLUMN IF EXISTS discord_avatar_url,
DROP COLUMN IF EXISTS discord_avatar_updated_at;
