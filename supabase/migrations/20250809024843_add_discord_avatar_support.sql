-- Add Discord avatar support to settlement_members table
-- This allows storing Discord user avatar information when users authenticate via Discord OAuth

ALTER TABLE settlement_members 
ADD COLUMN discord_user_id TEXT,
ADD COLUMN discord_username TEXT,
ADD COLUMN discord_global_name TEXT,
ADD COLUMN discord_avatar_hash TEXT,
ADD COLUMN discord_avatar_url TEXT,
ADD COLUMN discord_avatar_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient Discord user lookups
CREATE INDEX idx_settlement_members_discord_user_id ON settlement_members(discord_user_id);

-- Add comment to document the new fields
COMMENT ON COLUMN settlement_members.discord_user_id IS 'Discord user ID from OAuth authentication';
COMMENT ON COLUMN settlement_members.discord_username IS 'Discord username (legacy format: username#discriminator)';
COMMENT ON COLUMN settlement_members.discord_global_name IS 'Discord display name (new global name system)';
COMMENT ON COLUMN settlement_members.discord_avatar_hash IS 'Discord avatar hash for constructing avatar URLs';
COMMENT ON COLUMN settlement_members.discord_avatar_url IS 'Full Discord avatar URL with size parameter';
COMMENT ON COLUMN settlement_members.discord_avatar_updated_at IS 'When the Discord avatar was last fetched/updated';
