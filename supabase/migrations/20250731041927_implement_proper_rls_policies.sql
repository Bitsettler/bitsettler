-- Implement Proper Row Level Security Policies
-- This migration implements comprehensive RLS policies that handle:
-- 1. Settlement establishment (authenticated users creating settlement data)
-- 2. Character claiming (users linking to unclaimed characters)
-- 3. Settlement member access (members seeing their settlement data)
-- 4. API functionality (ensuring endpoints work correctly)

-- First, clean up any existing policies
DROP POLICY IF EXISTS "settlement_members_access" ON settlement_members;
DROP POLICY IF EXISTS "Users can view settlement members" ON settlement_members;
DROP POLICY IF EXISTS "Users can update their own claimed character" ON settlement_members;
DROP POLICY IF EXISTS "Users can claim unclaimed characters" ON settlement_members;

-- Enable RLS on settlement_members (was disabled in earlier migration)
ALTER TABLE settlement_members ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Allow reading settlement member data
-- This covers:
-- - Settlement search during establishment
-- - Members viewing their settlement roster
-- - APIs fetching settlement data
CREATE POLICY "settlement_members_select" ON settlement_members
FOR SELECT USING (
  -- Always allow reading settlement member data
  -- This enables settlement search, roster viewing, and API functionality
  true
);

-- Policy 2: INSERT - Allow creating settlement members during establishment
-- This covers:
-- - Settlement establishment process
-- - Importing member data from BitJita API
CREATE POLICY "settlement_members_insert" ON settlement_members
FOR INSERT WITH CHECK (
  -- Allow authenticated users to insert settlement member data
  -- This is needed for the settlement establishment process
  auth.uid() IS NOT NULL
);

-- Policy 3: UPDATE - Allow character claiming and personal data updates
-- This covers:
-- - Users claiming their characters (setting supabase_user_id)
-- - Users updating their own character information
CREATE POLICY "settlement_members_update" ON settlement_members
FOR UPDATE USING (
  -- Allow if user is authenticated AND one of these conditions:
  auth.uid() IS NOT NULL AND (
    -- Case 1: Character claiming - user is claiming an unclaimed character
    (supabase_user_id IS NULL AND auth.uid()::text IS NOT NULL) OR
    -- Case 2: Personal data update - user is updating their own claimed character
    supabase_user_id = auth.uid()::text
  )
);

-- Policy 4: DELETE - Restrict deletion to system operations only
-- Generally, we don't delete settlement members, but if needed, only allow system operations
CREATE POLICY "settlement_members_delete" ON settlement_members
FOR DELETE USING (
  -- Only allow deletion by system (could be used for cleanup operations)
  -- In practice, we typically use soft deletes (is_active = false)
  false  -- Disable deletion for now, can be adjusted later if needed
);

-- Create helper function to check if user is member of a specific settlement
CREATE OR REPLACE FUNCTION is_settlement_member_of(settlement_id_param TEXT, user_id_param TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM settlement_members 
    WHERE settlement_id = settlement_id_param
    AND supabase_user_id = COALESCE(user_id_param, auth.uid()::text)
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user's settlement ID
CREATE OR REPLACE FUNCTION get_user_settlement_id(user_id_param TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  settlement_id_result TEXT;
BEGIN
  SELECT settlement_id INTO settlement_id_result
  FROM settlement_members 
  WHERE supabase_user_id = COALESCE(user_id_param, auth.uid()::text)
  AND is_active = true
  LIMIT 1;
  
  RETURN settlement_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
GRANT EXECUTE ON FUNCTION is_settlement_member_of TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_settlement_id TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "settlement_members_select" ON settlement_members IS 
'Allow reading settlement member data for search, roster viewing, and API operations';

COMMENT ON POLICY "settlement_members_insert" ON settlement_members IS 
'Allow authenticated users to create settlement member data during establishment';

COMMENT ON POLICY "settlement_members_update" ON settlement_members IS 
'Allow character claiming and personal data updates for own characters';

COMMENT ON POLICY "settlement_members_delete" ON settlement_members IS 
'Restrict deletion to system operations only (currently disabled)';

COMMENT ON FUNCTION is_settlement_member_of IS 
'Helper function to check if a user is a member of a specific settlement';

COMMENT ON FUNCTION get_user_settlement_id IS 
'Helper function to get the settlement ID for a specific user';

-- Log the implementation
SELECT 'Implemented comprehensive RLS policies for settlement_members table' as message;
