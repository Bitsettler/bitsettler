-- RESET DATABASE SCRIPT - FOR LOCAL TESTING ONLY
-- This drops ALL existing tables and applies the new unified schema
-- 🚨 WARNING: THIS DELETES ALL DATA - ONLY RUN LOCALLY 🚨

-- Drop existing tables (in dependency order)
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS user_calculator_saves CASCADE;
DROP TABLE IF EXISTS member_contributions CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS project_items CASCADE;
DROP TABLE IF EXISTS settlement_projects CASCADE;
DROP TABLE IF EXISTS member_professions CASCADE;
DROP TABLE IF EXISTS settlement_citizens CASCADE;
DROP TABLE IF EXISTS settlement_members CASCADE;
DROP TABLE IF EXISTS skill_names CASCADE;
DROP TABLE IF EXISTS treasury_transactions CASCADE;
DROP TABLE IF EXISTS treasury_accounts CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_citizen_top_profession() CASCADE;
DROP FUNCTION IF EXISTS claim_character(TEXT, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_member_skills_aggregation() CASCADE;

-- Now apply the new unified schema
-- Settlement Members (game data + app user data + skills unified)
CREATE TABLE settlement_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Game data (from BitJita API)
  settlement_id TEXT NOT NULL, -- Settlement identifier
  entity_id TEXT NOT NULL, -- Game entity ID (BitJita)
  claim_entity_id TEXT,
  player_entity_id TEXT,
  name TEXT NOT NULL, -- In-game character name (user_name from API)
  
  -- Skills data (from BitJita API)
  skills JSONB DEFAULT '{}', -- {skillName: level} format
  total_skills INTEGER DEFAULT 0,
  highest_level INTEGER DEFAULT 0,
  total_level INTEGER DEFAULT 0,
  total_xp BIGINT DEFAULT 0,
  top_profession TEXT, -- Calculated from highest skill
  
  -- Member permissions and status
  inventory_permission INTEGER DEFAULT 0,
  build_permission INTEGER DEFAULT 0,
  officer_permission INTEGER DEFAULT 0,
  co_owner_permission INTEGER DEFAULT 0,
  last_login_timestamp TIMESTAMP WITH TIME ZONE,
  joined_settlement_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- App user data (when they claim their character)
  auth_user_id TEXT UNIQUE, -- NextAuth JWT user.id - NULL until they sign up
  display_name TEXT, -- App display name (defaults to 'name' but customizable)
  discord_handle TEXT,
  bio TEXT,
  timezone TEXT,
  preferred_contact TEXT DEFAULT 'discord' CHECK (preferred_contact IN ('discord', 'in-game', 'app')),
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  profile_color TEXT DEFAULT '#3b82f6',
  
  -- App settings
  default_settlement_view TEXT DEFAULT 'dashboard',
  notifications_enabled BOOLEAN DEFAULT true,
  activity_tracking_enabled BOOLEAN DEFAULT true,
  
  -- Sync timestamps
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- BitJita sync
  sync_source TEXT DEFAULT 'bitjita',
  app_joined_at TIMESTAMP WITH TIME ZONE, -- When they first claimed this character
  app_last_active_at TIMESTAMP WITH TIME ZONE, -- Last app usage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(settlement_id, entity_id)
);

-- Skill names reference table (for mapping skill IDs to readable names)
CREATE TABLE skill_names (
  skill_id TEXT PRIMARY KEY,
  skill_name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlement Projects  
CREATE TABLE settlement_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  created_by_member_id UUID REFERENCES settlement_members(id), -- Link to actual member
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Items
CREATE TABLE project_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES settlement_projects(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  required_quantity INTEGER NOT NULL CHECK (required_quantity > 0),
  current_quantity INTEGER NOT NULL DEFAULT 0,
  tier INTEGER DEFAULT 1 CHECK (tier >= 1 AND tier <= 4),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  rank_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Needed' CHECK (status IN ('Needed', 'In Progress', 'Completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Members (assignments)
CREATE TABLE project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES settlement_projects(id) ON DELETE CASCADE,
  member_id UUID REFERENCES settlement_members(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'Contributor' CHECK (role IN ('Leader', 'Contributor', 'Observer')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, member_id)
);

-- Member Contributions
CREATE TABLE member_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES settlement_projects(id) ON DELETE CASCADE,
  member_id UUID REFERENCES settlement_members(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  contribution_type TEXT NOT NULL DEFAULT 'Direct' CHECK (contribution_type IN ('Direct', 'Crafted', 'Purchased')),
  notes TEXT,
  contributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Calculator Saves (tied to settlement members)
CREATE TABLE user_calculator_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES settlement_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  item_slug TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity Tracking
CREATE TABLE user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES settlement_members(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'settlement_view', 'calculator_use', 'project_create', etc.
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_settlement_members_settlement_id ON settlement_members(settlement_id);
CREATE INDEX idx_settlement_members_entity_id ON settlement_members(entity_id);
CREATE INDEX idx_settlement_members_auth_user_id ON settlement_members(auth_user_id);
CREATE INDEX idx_settlement_members_active ON settlement_members(is_active) WHERE is_active = true;
CREATE INDEX idx_settlement_members_last_login ON settlement_members(last_login_timestamp DESC);
CREATE INDEX idx_settlement_members_top_profession ON settlement_members(top_profession);
CREATE INDEX idx_skill_names_skill_name ON skill_names(skill_name);
CREATE INDEX idx_project_items_project_id ON project_items(project_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_member_id ON project_members(member_id);
CREATE INDEX idx_member_contributions_project_id ON member_contributions(project_id);
CREATE INDEX idx_member_contributions_member_id ON member_contributions(member_id);
CREATE INDEX idx_user_calculator_saves_member_id ON user_calculator_saves(member_id);
CREATE INDEX idx_user_activity_member_id ON user_activity(member_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_skill_names_updated_at BEFORE UPDATE ON skill_names FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settlement_projects_updated_at BEFORE UPDATE ON settlement_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_items_updated_at BEFORE UPDATE ON project_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_calculator_saves_updated_at BEFORE UPDATE ON user_calculator_saves FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Skills aggregation trigger
CREATE OR REPLACE FUNCTION update_member_skills_aggregation()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate aggregated skills data from skills JSONB
    IF NEW.skills IS NOT NULL AND NEW.skills != '{}' THEN
        -- Count total skills (non-zero values)
        SELECT COUNT(*)
        INTO NEW.total_skills
        FROM jsonb_each_text(NEW.skills)
        WHERE value::integer > 0;
        
        -- Calculate total level (sum of all skill levels)
        SELECT COALESCE(SUM(value::integer), 0)
        INTO NEW.total_level
        FROM jsonb_each_text(NEW.skills);
        
        -- Find highest level
        SELECT COALESCE(MAX(value::integer), 0)
        INTO NEW.highest_level
        FROM jsonb_each_text(NEW.skills);
        
        -- Find top profession (highest skill)
        SELECT key INTO NEW.top_profession
        FROM jsonb_each_text(NEW.skills)
        ORDER BY value::integer DESC
        LIMIT 1;
        
        -- Calculate estimated total XP (simplified calculation)
        -- This is an approximation - real XP calculation would need game formulas
        NEW.total_xp = NEW.total_level * 100;
    ELSE
        -- No skills data
        NEW.total_skills = 0;
        NEW.total_level = 0;
        NEW.highest_level = 0;
        NEW.total_xp = 0;
        NEW.top_profession = 'Unknown';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_member_skills_aggregation
    BEFORE INSERT OR UPDATE ON settlement_members
    FOR EACH ROW
    EXECUTE FUNCTION update_member_skills_aggregation();

-- Helper function for character claiming
CREATE OR REPLACE FUNCTION claim_character(
  p_auth_user_id TEXT,
  p_member_id UUID,
  p_display_name TEXT DEFAULT NULL
)
RETURNS settlement_members AS $$
DECLARE
  result settlement_members;
BEGIN
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

-- Insert some test data
INSERT INTO settlement_members (
  settlement_id, entity_id, name, skills, 
  inventory_permission, build_permission, officer_permission
) VALUES 
  ('settlement_1', 'entity_001', 'TestPlayer1', '{"Farming": 25, "Mining": 18, "Crafting": 12}', 1, 1, 0),
  ('settlement_1', 'entity_002', 'TestPlayer2', '{"Combat": 30, "Building": 22}', 1, 0, 0),
  ('settlement_1', 'entity_003', 'TestPlayer3', '{"Alchemy": 15, "Trading": 28}', 0, 0, 1);

-- Insert skill names for testing
INSERT INTO skill_names (skill_id, skill_name, category) VALUES
  ('farming', 'Farming', 'Production'),
  ('mining', 'Mining', 'Production'),
  ('crafting', 'Crafting', 'Production'),
  ('combat', 'Combat', 'Combat'),
  ('building', 'Building', 'Construction'),
  ('alchemy', 'Alchemy', 'Production'),
  ('trading', 'Trading', 'Social');

-- Comments
COMMENT ON TABLE settlement_members IS 'Unified settlement members - game data, skills, and app users all in one table';
COMMENT ON COLUMN settlement_members.auth_user_id IS 'NextAuth user ID - NULL means character not claimed by app user yet';
COMMENT ON COLUMN settlement_members.skills IS 'Skills data as JSONB {skillName: level} format from BitJita API';
COMMENT ON COLUMN settlement_members.total_skills IS 'Auto-calculated count of skills with level > 0';
COMMENT ON COLUMN settlement_members.top_profession IS 'Auto-calculated highest skill name';
COMMENT ON COLUMN settlement_members.display_name IS 'App display name - defaults to game name but user can customize';
COMMENT ON TABLE skill_names IS 'Reference table mapping skill IDs to readable names';
COMMENT ON FUNCTION claim_character IS 'Links NextAuth user to their settlement character';
COMMENT ON FUNCTION update_member_skills_aggregation IS 'Auto-calculates skills totals when skills JSONB changes';

-- Success message
SELECT 'Database reset complete! New unified schema applied with test data.' AS status; 