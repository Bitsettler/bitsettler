-- Migration: Add Row Level Security for Supabase Auth
-- This migration adds RLS policies to secure settlement data based on Supabase Auth

-- Enable RLS on settlement-related tables
ALTER TABLE settlement_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calculator_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;

-- Settlement Members: Users can see all members in their settlement, but only update their own claimed character
CREATE POLICY "Users can view settlement members" ON settlement_members
  FOR SELECT USING (true); -- All authenticated users can see settlement members

CREATE POLICY "Users can update their own claimed character" ON settlement_members
  FOR UPDATE USING (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can claim unclaimed characters" ON settlement_members
  FOR UPDATE USING (auth_user_id IS NULL); -- Allow claiming unclaimed characters

-- Settlement Projects: Users can see all projects, but only create/update if they're settlement members
CREATE POLICY "Users can view settlement projects" ON settlement_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM settlement_members 
      WHERE settlement_members.auth_user_id = auth.uid()::text
      AND settlement_members.settlement_id = 'settlement_1' -- TODO: Make this dynamic
    )
  );

CREATE POLICY "Settlement members can create projects" ON settlement_projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM settlement_members 
      WHERE settlement_members.auth_user_id = auth.uid()::text
      AND settlement_members.settlement_id = 'settlement_1'
    )
  );

CREATE POLICY "Project creators can update their projects" ON settlement_projects
  FOR UPDATE USING (
    created_by_member_id IN (
      SELECT id FROM settlement_members 
      WHERE auth_user_id = auth.uid()::text
    )
  );

-- Project Items: Readable by settlement members, manageable by project members
CREATE POLICY "Settlement members can view project items" ON project_items
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM settlement_projects
      WHERE EXISTS (
        SELECT 1 FROM settlement_members 
        WHERE settlement_members.auth_user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Project members can manage project items" ON project_items
  FOR ALL USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      JOIN settlement_members sm ON pm.member_id = sm.id
      WHERE sm.auth_user_id = auth.uid()::text
    )
  );

-- Project Members: Viewable by settlement members, manageable by project leaders
CREATE POLICY "Settlement members can view project members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM settlement_members 
      WHERE settlement_members.auth_user_id = auth.uid()::text
    )
  );

-- Member Contributions: Users can see all contributions, but only add their own
CREATE POLICY "Users can view all contributions" ON member_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM settlement_members 
      WHERE settlement_members.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can add their own contributions" ON member_contributions
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM settlement_members 
      WHERE auth_user_id = auth.uid()::text
    )
  );

-- User Calculator Saves: Users can only access their own saves
CREATE POLICY "Users can access their own calculator saves" ON user_calculator_saves
  FOR ALL USING (
    member_id IN (
      SELECT id FROM settlement_members 
      WHERE auth_user_id = auth.uid()::text
    )
  );

-- User Activity: Users can only access their own activity
CREATE POLICY "Users can access their own activity" ON user_activity
  FOR ALL USING (
    member_id IN (
      SELECT id FROM settlement_members 
      WHERE auth_user_id = auth.uid()::text
    )
  );

-- Treasury Transactions: Settlement members can view, authorized members can add
CREATE POLICY "Settlement members can view treasury transactions" ON treasury_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM settlement_members 
      WHERE settlement_members.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Settlement members can add treasury transactions" ON treasury_transactions
  FOR INSERT WITH CHECK (
    related_member_id IN (
      SELECT id FROM settlement_members 
      WHERE auth_user_id = auth.uid()::text
    ) OR related_member_id IS NULL -- Allow system transactions
  );

CREATE POLICY "Users can update their own treasury transactions" ON treasury_transactions
  FOR UPDATE USING (
    related_member_id IN (
      SELECT id FROM settlement_members 
      WHERE auth_user_id = auth.uid()::text
    )
  );

-- Create a helper function to check if user is settlement member
CREATE OR REPLACE FUNCTION is_settlement_member(user_id TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM settlement_members 
    WHERE auth_user_id = COALESCE(user_id, auth.uid()::text)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage on auth schema to authenticated users (needed for auth.uid())
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

COMMENT ON FUNCTION is_settlement_member IS 'Helper function to check if a user is a settlement member';

-- Success message
SELECT 'RLS policies added: Settlement data is now secured with Supabase Auth' AS status;
