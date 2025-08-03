-- Add user-selected profession fields to settlement_members table
-- This allows users to choose their primary and secondary professions instead of auto-calculating from skills

-- Add primary and secondary profession fields
ALTER TABLE settlement_members 
ADD COLUMN IF NOT EXISTS primary_profession TEXT,
ADD COLUMN IF NOT EXISTS secondary_profession TEXT;

-- Add comments to explain the fields
COMMENT ON COLUMN settlement_members.primary_profession IS 'User-selected primary profession (overrides calculated top_profession)';
COMMENT ON COLUMN settlement_members.secondary_profession IS 'User-selected secondary profession';
COMMENT ON COLUMN settlement_members.top_profession IS 'Auto-calculated highest skill profession (used as fallback if primary_profession not set)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_settlement_members_primary_profession ON settlement_members(primary_profession);
CREATE INDEX IF NOT EXISTS idx_settlement_members_secondary_profession ON settlement_members(secondary_profession);

-- Add check constraints to ensure valid profession values
-- Note: We'll validate against the PROFESSIONS list in the application layer for flexibility
