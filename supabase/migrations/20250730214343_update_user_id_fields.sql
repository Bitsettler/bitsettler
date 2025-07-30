-- Update settlement_members table to use separate Supabase and BitJita user IDs
-- This provides clean separation between app authentication and game API integration

-- Step 1: Add the new bitjita_user_id column
ALTER TABLE settlement_members 
ADD COLUMN bitjita_user_id TEXT UNIQUE;

-- Step 2: Rename auth_user_id to supabase_user_id for clarity
ALTER TABLE settlement_members 
RENAME COLUMN auth_user_id TO supabase_user_id;

-- Step 3: Update the unique constraint
ALTER TABLE settlement_members 
DROP CONSTRAINT IF EXISTS settlement_members_auth_user_id_key;

ALTER TABLE settlement_members 
ADD CONSTRAINT settlement_members_supabase_user_id_key UNIQUE (supabase_user_id);

-- Step 4: Add index for bitjita_user_id for performance
CREATE INDEX idx_settlement_members_bitjita_user_id ON settlement_members(bitjita_user_id);

-- Step 5: Drop the old claim_character function and create new one with updated signature
DROP FUNCTION IF EXISTS claim_character(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION claim_character(
  p_supabase_user_id TEXT,
  p_member_id UUID,
  p_bitjita_user_id TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS settlement_members AS $$
DECLARE
  result settlement_members;
BEGIN
  UPDATE settlement_members 
  SET 
    supabase_user_id = p_supabase_user_id,
    bitjita_user_id = p_bitjita_user_id,
    display_name = COALESCE(p_display_name, name),
    app_joined_at = NOW(),
    app_last_active_at = NOW()
  WHERE id = p_member_id AND supabase_user_id IS NULL -- Only unclaimed characters
  RETURNING * INTO result;
  
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Character not found or already claimed';
  END IF;
  
  RETURN result;
END;
$$ language 'plpgsql';

-- Step 6: Update the index that was using auth_user_id
DROP INDEX IF EXISTS idx_settlement_members_auth_user_id;
CREATE INDEX idx_settlement_members_supabase_user_id ON settlement_members(supabase_user_id);

-- Step 7: Update comments to reflect the new structure
COMMENT ON COLUMN settlement_members.supabase_user_id IS 'Supabase Auth user ID - NULL means character not claimed by app user yet';
COMMENT ON COLUMN settlement_members.bitjita_user_id IS 'BitJita user ID (e.g., 432345564239953880) - used for API calls to game services';
COMMENT ON FUNCTION claim_character IS 'Links Supabase Auth user to their settlement character with BitJita user ID for API integration';
