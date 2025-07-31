-- Implement Complete RLS Policies for All Settlement Tables
-- This migration implements role-based RLS policies for all settlement tables
-- that respect the in-game permission hierarchy

-- Helper function to check if user is member of a settlement (drop if exists to avoid conflicts)
DROP FUNCTION IF EXISTS is_settlement_member(TEXT, TEXT);
DROP FUNCTION IF EXISTS is_settlement_member(TEXT);

CREATE OR REPLACE FUNCTION is_settlement_member(settlement_id_param TEXT, user_id_param TEXT DEFAULT NULL)
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

-- Helper function to check user permissions level
DROP FUNCTION IF EXISTS get_user_settlement_permissions(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_settlement_permissions(TEXT);

CREATE OR REPLACE FUNCTION get_user_settlement_permissions(settlement_id_param TEXT, user_id_param TEXT DEFAULT NULL)
RETURNS TABLE(
  inventory_permission INTEGER,
  build_permission INTEGER,
  officer_permission INTEGER,
  co_owner_permission INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.inventory_permission,
    sm.build_permission,
    sm.officer_permission,
    sm.co_owner_permission
  FROM settlement_members sm
  WHERE sm.settlement_id = settlement_id_param
  AND sm.supabase_user_id = COALESCE(user_id_param, auth.uid()::text)
  AND sm.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has management permissions (officer or co-owner)
DROP FUNCTION IF EXISTS has_settlement_management_permission(TEXT, TEXT);
DROP FUNCTION IF EXISTS has_settlement_management_permission(TEXT);

CREATE OR REPLACE FUNCTION has_settlement_management_permission(settlement_id_param TEXT, user_id_param TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM settlement_members 
    WHERE settlement_id = settlement_id_param
    AND supabase_user_id = COALESCE(user_id_param, auth.uid()::text)
    AND is_active = true
    AND (officer_permission > 0 OR co_owner_permission > 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up any existing policies for other tables
DROP POLICY IF EXISTS "Users can view settlement projects" ON settlement_projects;
DROP POLICY IF EXISTS "Settlement members can create projects" ON settlement_projects;
DROP POLICY IF EXISTS "Project creators can update their projects" ON settlement_projects;

-- SETTLEMENT PROJECTS: Role-based access through member relationship
-- All settlement members can view projects from their settlement
-- Storage/Builder/Officer/Co-owner can manage projects
CREATE POLICY "settlement_projects_select" ON settlement_projects
FOR SELECT USING (
  -- Allow settlement members to view projects from their settlement
  created_by_member_id IN (
    SELECT sm.id FROM settlement_members sm
    WHERE is_settlement_member(sm.settlement_id)
  )
);

CREATE POLICY "settlement_projects_insert" ON settlement_projects
FOR INSERT WITH CHECK (
  -- Allow if user has build permission or higher
  created_by_member_id IN (
    SELECT id FROM settlement_members 
    WHERE supabase_user_id = auth.uid()::text
    AND is_active = true
    AND (build_permission > 0 OR inventory_permission > 0 OR officer_permission > 0 OR co_owner_permission > 0)
  )
);

CREATE POLICY "settlement_projects_update" ON settlement_projects
FOR UPDATE USING (
  -- Allow if user has build permission or higher, or is project creator
  created_by_member_id IN (
    SELECT id FROM settlement_members 
    WHERE supabase_user_id = auth.uid()::text
    AND is_active = true
    AND (build_permission > 0 OR inventory_permission > 0 OR officer_permission > 0 OR co_owner_permission > 0)
  ) OR 
  created_by_member_id IN (
    SELECT id FROM settlement_members WHERE supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY "settlement_projects_delete" ON settlement_projects
FOR DELETE USING (
  -- Only officers/co-owners or project creators can delete
  created_by_member_id IN (
    SELECT id FROM settlement_members sm
    WHERE sm.supabase_user_id = auth.uid()::text
    AND sm.is_active = true
    AND (sm.officer_permission > 0 OR sm.co_owner_permission > 0)
  ) OR 
  created_by_member_id IN (
    SELECT id FROM settlement_members WHERE supabase_user_id = auth.uid()::text
  )
);

-- PROJECT ITEMS: Follow project permissions through member relationship
CREATE POLICY "project_items_select" ON project_items
FOR SELECT USING (
  -- Allow if user can view the related project
  project_id IN (
    SELECT sp.id FROM settlement_projects sp
    WHERE sp.created_by_member_id IN (
      SELECT sm.id FROM settlement_members sm
      WHERE is_settlement_member(sm.settlement_id)
    )
  )
);

CREATE POLICY "project_items_insert" ON project_items
FOR INSERT WITH CHECK (
  -- Allow if user can manage the related project
  project_id IN (
    SELECT sp.id FROM settlement_projects sp
    WHERE sp.created_by_member_id IN (
      SELECT sm.id FROM settlement_members sm
      WHERE sm.supabase_user_id = auth.uid()::text
      AND sm.is_active = true
      AND (sm.build_permission > 0 OR sm.inventory_permission > 0 OR sm.officer_permission > 0 OR sm.co_owner_permission > 0)
    )
  )
);

CREATE POLICY "project_items_update" ON project_items
FOR UPDATE USING (
  project_id IN (
    SELECT sp.id FROM settlement_projects sp
    WHERE sp.created_by_member_id IN (
      SELECT sm.id FROM settlement_members sm
      WHERE sm.supabase_user_id = auth.uid()::text
      AND sm.is_active = true
      AND (sm.build_permission > 0 OR sm.inventory_permission > 0 OR sm.officer_permission > 0 OR sm.co_owner_permission > 0)
    )
  )
);

CREATE POLICY "project_items_delete" ON project_items
FOR DELETE USING (
  project_id IN (
    SELECT sp.id FROM settlement_projects sp
    WHERE sp.created_by_member_id IN (
      SELECT sm.id FROM settlement_members sm
      WHERE sm.supabase_user_id = auth.uid()::text
      AND sm.is_active = true
      AND (sm.officer_permission > 0 OR sm.co_owner_permission > 0)
    ) OR sp.created_by_member_id IN (
      SELECT id FROM settlement_members WHERE supabase_user_id = auth.uid()::text
    )
  )
);

-- PROJECT MEMBERS: Follow project permissions through member relationship
CREATE POLICY "project_members_select" ON project_members
FOR SELECT USING (
  project_id IN (
    SELECT sp.id FROM settlement_projects sp
    WHERE sp.created_by_member_id IN (
      SELECT sm.id FROM settlement_members sm
      WHERE is_settlement_member(sm.settlement_id)
    )
  )
);

CREATE POLICY "project_members_insert" ON project_members
FOR INSERT WITH CHECK (
  project_id IN (
    SELECT sp.id FROM settlement_projects sp
    WHERE sp.created_by_member_id IN (
      SELECT sm.id FROM settlement_members sm
      WHERE sm.supabase_user_id = auth.uid()::text
      AND sm.is_active = true
      AND (sm.officer_permission > 0 OR sm.co_owner_permission > 0)
    ) OR sp.created_by_member_id IN (
      SELECT id FROM settlement_members WHERE supabase_user_id = auth.uid()::text
    )
  )
);

CREATE POLICY "project_members_update" ON project_members
FOR UPDATE USING (
  project_id IN (
    SELECT sp.id FROM settlement_projects sp
    WHERE sp.created_by_member_id IN (
      SELECT sm.id FROM settlement_members sm
      WHERE sm.supabase_user_id = auth.uid()::text
      AND sm.is_active = true
      AND (sm.officer_permission > 0 OR sm.co_owner_permission > 0)
    ) OR sp.created_by_member_id IN (
      SELECT id FROM settlement_members WHERE supabase_user_id = auth.uid()::text
    )
  )
);

CREATE POLICY "project_members_delete" ON project_members
FOR DELETE USING (
  project_id IN (
    SELECT sp.id FROM settlement_projects sp
    WHERE sp.created_by_member_id IN (
      SELECT sm.id FROM settlement_members sm
      WHERE sm.supabase_user_id = auth.uid()::text
      AND sm.is_active = true
      AND (sm.officer_permission > 0 OR sm.co_owner_permission > 0)
    ) OR sp.created_by_member_id IN (
      SELECT id FROM settlement_members WHERE supabase_user_id = auth.uid()::text
    )
  )
);

-- MEMBER CONTRIBUTIONS: Settlement members can view, contributors can manage their own
CREATE POLICY "member_contributions_select" ON member_contributions
FOR SELECT USING (
  -- Settlement members can view all contributions from their settlement
  member_id IN (
    SELECT sm.id FROM settlement_members sm
    WHERE is_settlement_member(sm.settlement_id)
  )
);

CREATE POLICY "member_contributions_insert" ON member_contributions
FOR INSERT WITH CHECK (
  -- Users can only create contributions for themselves or if they're officers+
  member_id IN (
    SELECT id FROM settlement_members 
    WHERE supabase_user_id = auth.uid()::text
    AND is_active = true
  ) OR 
  member_id IN (
    SELECT sm.id FROM settlement_members sm
    WHERE sm.supabase_user_id = auth.uid()::text
    AND sm.is_active = true
    AND (sm.officer_permission > 0 OR sm.co_owner_permission > 0)
  )
);

CREATE POLICY "member_contributions_update" ON member_contributions
FOR UPDATE USING (
  -- Users can update their own contributions or officers+ can update any
  member_id IN (
    SELECT id FROM settlement_members 
    WHERE supabase_user_id = auth.uid()::text
    AND is_active = true
  ) OR 
  member_id IN (
    SELECT sm.id FROM settlement_members sm
    WHERE sm.supabase_user_id = auth.uid()::text
    AND sm.is_active = true
    AND (sm.officer_permission > 0 OR sm.co_owner_permission > 0)
  )
);

-- TREASURY TRANSACTIONS: All members view, officers+ manage
CREATE POLICY "treasury_transactions_select" ON treasury_transactions
FOR SELECT USING (
  -- Settlement members can view treasury transactions from their settlement
  related_member_id IN (
    SELECT sm.id FROM settlement_members sm
    WHERE is_settlement_member(sm.settlement_id)
  ) OR 
  -- Allow system transactions (related_member_id is NULL)
  related_member_id IS NULL
);

CREATE POLICY "treasury_transactions_insert" ON treasury_transactions
FOR INSERT WITH CHECK (
  -- Officers/co-owners can create transactions
  related_member_id IN (
    SELECT sm.id FROM settlement_members sm
    WHERE sm.supabase_user_id = auth.uid()::text
    AND sm.is_active = true
    AND (sm.officer_permission > 0 OR sm.co_owner_permission > 0)
  ) OR 
  -- Allow system transactions
  related_member_id IS NULL
);

CREATE POLICY "treasury_transactions_update" ON treasury_transactions
FOR UPDATE USING (
  -- Officers/co-owners can update transactions
  related_member_id IN (
    SELECT sm.id FROM settlement_members sm
    WHERE sm.supabase_user_id = auth.uid()::text
    AND sm.is_active = true
    AND (sm.officer_permission > 0 OR sm.co_owner_permission > 0)
  )
);

-- USER CALCULATOR SAVES: Users can only access their own saves
CREATE POLICY "user_calculator_saves_all" ON user_calculator_saves
FOR ALL USING (
  -- Users can only access their own calculator saves
  member_id IN (
    SELECT id FROM settlement_members 
    WHERE supabase_user_id = auth.uid()::text
    AND is_active = true
  )
);

-- USER ACTIVITY: Users can only access their own activity
CREATE POLICY "user_activity_all" ON user_activity
FOR ALL USING (
  -- Users can only access their own activity
  member_id IN (
    SELECT id FROM settlement_members 
    WHERE supabase_user_id = auth.uid()::text
    AND is_active = true
  )
);

-- Grant permissions on helper functions
GRANT EXECUTE ON FUNCTION is_settlement_member TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_settlement_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION has_settlement_management_permission TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION is_settlement_member IS 'Check if user is member of a specific settlement';
COMMENT ON FUNCTION get_user_settlement_permissions IS 'Get user permission levels for a settlement';
COMMENT ON FUNCTION has_settlement_management_permission IS 'Check if user has officer or co-owner permissions';

-- Log the implementation
SELECT 'Implemented comprehensive role-based RLS policies for all settlement tables' as message;
