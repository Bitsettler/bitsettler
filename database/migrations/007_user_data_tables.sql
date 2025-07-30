-- User Data Tables Migration - Unified Approach
-- Extend settlement_members instead of creating separate user tables
-- Migration: 007_user_data_tables.sql

-- Extend settlement_members with app user data
-- This way settlement members and app users are the same entity
ALTER TABLE settlement_members ADD COLUMN IF NOT EXISTS
  -- Auth linking (already exists from migration 002)
  -- auth_user_id TEXT UNIQUE,
  
  -- App user profile data
  display_name TEXT, -- Defaults to 'name' field but user can customize
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
  
  -- App usage
  app_last_active_at TIMESTAMP WITH TIME ZONE,
  app_joined_at TIMESTAMP WITH TIME ZONE; -- When they first signed up for the app

-- User calculator saves (separate table makes sense)
CREATE TABLE user_calculator_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES settlement_members(id), -- Direct link to settlement member
  name TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  item_slug TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity log (separate table makes sense) 
CREATE TABLE user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES settlement_members(id), -- Direct link to settlement member
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_settlement_members_auth_user_id ON settlement_members(auth_user_id);
CREATE INDEX idx_user_calculator_saves_member_id ON user_calculator_saves(member_id);
CREATE INDEX idx_user_activity_member_id ON user_activity(member_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);

-- Updated timestamp trigger for calculator saves
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_calculator_saves_updated_at 
  BEFORE UPDATE ON user_calculator_saves 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to initialize app user data when someone first signs up
CREATE OR REPLACE FUNCTION initialize_app_user(
  p_auth_user_id TEXT,
  p_member_id UUID,
  p_display_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE settlement_members 
  SET 
    auth_user_id = p_auth_user_id,
    display_name = COALESCE(p_display_name, name), -- Use their game name as default
    app_joined_at = NOW(),
    app_last_active_at = NOW()
  WHERE id = p_member_id;
END;
$$ language 'plpgsql';

-- Comments
COMMENT ON COLUMN settlement_members.auth_user_id IS 'Links to NextAuth user - when null, member hasnt signed up for app yet';
COMMENT ON COLUMN settlement_members.display_name IS 'App display name - defaults to game name but user can customize';
COMMENT ON COLUMN settlement_members.app_joined_at IS 'When this settlement member first signed up for the web app';
COMMENT ON TABLE user_calculator_saves IS 'User-saved calculator recipes linked to settlement members';
COMMENT ON TABLE user_activity IS 'User activity tracking linked to settlement members'; 