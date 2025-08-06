-- Settlement Management Core Schema V2 - Unified Design
-- Clean slate design combining game data and app users in one table

-- Settlement Members (game data + app user data + skills unified)
CREATE TABLE settlement_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Game data (from BitJita API)
  settlement_id TEXT NOT NULL, -- Settlement identifier
  player_entity_id TEXT NOT NULL, -- PRIMARY: BitJita player character ID (stable, never changes)
  entity_id TEXT, -- SECONDARY: Generic BitJita entity ID (can be reused for different objects)
  claim_entity_id TEXT, -- Settlement/territory claim ID
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
  auth_user_id TEXT UNIQUE, -- Supabase Auth user ID - NULL until they sign up
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
  UNIQUE(settlement_id, player_entity_id) -- PRIMARY: One player per settlement
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

-- Comments
COMMENT ON TABLE settlement_members IS 'Unified settlement members - game data, skills, and app users all in one table';
COMMENT ON COLUMN settlement_members.player_entity_id IS 'PRIMARY: BitJita player character ID - stable, recommended by devs, never changes';
COMMENT ON COLUMN settlement_members.entity_id IS 'SECONDARY: Generic BitJita entity ID - can be reused for different game objects';
COMMENT ON COLUMN settlement_members.claim_entity_id IS 'BitJita settlement/territory claim ID';
COMMENT ON COLUMN settlement_members.auth_user_id IS 'Supabase Auth user ID - NULL means character not claimed by app user yet';
COMMENT ON COLUMN settlement_members.skills IS 'Skills data as JSONB {skillName: level} format from BitJita API';
COMMENT ON COLUMN settlement_members.total_skills IS 'Auto-calculated count of skills with level > 0';
COMMENT ON COLUMN settlement_members.top_profession IS 'Auto-calculated highest skill name';
COMMENT ON COLUMN settlement_members.display_name IS 'App display name - defaults to game name but user can customize';
COMMENT ON TABLE skill_names IS 'Reference table mapping skill IDs to readable names';
COMMENT ON FUNCTION claim_character IS 'Links Supabase Auth user to their settlement character';
COMMENT ON FUNCTION update_member_skills_aggregation IS 'Auto-calculates skills totals when skills JSONB changes';