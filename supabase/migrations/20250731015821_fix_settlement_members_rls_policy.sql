-- Fix RLS policy for settlement_members to allow establishment process

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "settlement_members_policy" ON settlement_members;

-- Create a more permissive policy that allows:
-- 1. Authenticated users to insert members during establishment
-- 2. Users to read/update their own claimed characters
-- 3. Settlement owners/officers to manage members
CREATE POLICY "settlement_members_access" ON settlement_members
FOR ALL USING (
  -- Allow read access to settlement members
  true
)
WITH CHECK (
  -- Allow insert/update if:
  -- 1. User is authenticated (for establishment process)
  -- 2. User is claiming their own character (supabase_user_id matches)
  -- 3. Member is being created during establishment (no supabase_user_id yet)
  auth.uid() IS NOT NULL AND (
    supabase_user_id IS NULL OR  -- During establishment, before claiming
    supabase_user_id = auth.uid()::text  -- User claiming their own character (cast uuid to text)
  )
);

-- Ensure RLS is enabled
ALTER TABLE settlement_members ENABLE ROW LEVEL SECURITY;

-- Log the fix
SELECT 'Fixed settlement_members RLS policy for establishment process' as message;
