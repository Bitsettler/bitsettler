-- Migration: Convert from NextAuth to Supabase Auth
-- This migration updates the settlement_members table to work with Supabase Auth instead of NextAuth

-- Update column comments to reflect Supabase Auth
COMMENT ON COLUMN settlement_members.auth_user_id IS 'Supabase Auth user.id (from auth.users) - NULL means character not claimed by app user yet';

-- Update function comments
COMMENT ON FUNCTION claim_character IS 'Links Supabase Auth user to their settlement character';

-- Clear existing NextAuth user IDs since they are no longer valid
-- This forces users to re-claim their characters with Supabase Auth
UPDATE settlement_members 
SET auth_user_id = NULL, 
    app_joined_at = NULL, 
    app_last_active_at = NULL
WHERE auth_user_id IS NOT NULL;

-- Update the claim_character function to work with Supabase Auth UUIDs
CREATE OR REPLACE FUNCTION claim_character(
  p_auth_user_id TEXT,
  p_member_id UUID,
  p_display_name TEXT DEFAULT NULL
)
RETURNS settlement_members AS $$
DECLARE
  result settlement_members;
BEGIN
  -- Validate that the auth_user_id is a valid UUID format (Supabase Auth uses UUIDs)
  BEGIN
    PERFORM p_auth_user_id::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid auth_user_id format: must be a valid UUID';
  END;

  UPDATE settlement_members 
  SET 
    auth_user_id = p_auth_user_id,
    display_name = COALESCE(p_display_name, name),
    app_joined_at = NOW(),
    app_last_active_at = NOW()
  WHERE id = p_member_id AND auth_user_id IS NULL -- Only unclaimed characters
  RETURNING * INTO result;
  
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Character not found or already claimed';
  END IF;
  
  RETURN result;
END;
$$ language 'plpgsql';

-- Add constraint to ensure auth_user_id follows UUID format if not null
ALTER TABLE settlement_members 
ADD CONSTRAINT settlement_members_auth_user_id_uuid_check 
CHECK (auth_user_id IS NULL OR auth_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Create a helpful view to show claimed vs unclaimed characters
CREATE OR REPLACE VIEW settlement_members_auth_status AS
SELECT 
  id,
  settlement_id,
  name,
  auth_user_id,
  display_name,
  CASE 
    WHEN auth_user_id IS NOT NULL THEN 'claimed'
    ELSE 'unclaimed'
  END as claim_status,
  app_joined_at,
  app_last_active_at,
  last_login_timestamp,
  total_skills,
  top_profession
FROM settlement_members
ORDER BY claim_status DESC, name;

COMMENT ON VIEW settlement_members_auth_status IS 'Helper view to see which settlement members have been claimed by Supabase Auth users';

-- Success message
SELECT 'Migration complete: Settlement members table updated for Supabase Auth' AS status;
