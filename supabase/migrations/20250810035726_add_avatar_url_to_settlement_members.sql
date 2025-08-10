-- Add avatar_url column to settlement_members table
-- This will store Discord avatar URLs from OAuth user_metadata

ALTER TABLE settlement_members 
ADD COLUMN avatar_url TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_settlement_members_avatar_url ON settlement_members(avatar_url) WHERE avatar_url IS NOT NULL;

-- Comment on new column
COMMENT ON COLUMN settlement_members.avatar_url IS 'Discord avatar URL from OAuth user_metadata';
