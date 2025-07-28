-- Migration: Store BitJita skill names in database
-- This allows us to cache skill ID -> name mappings instead of hitting BitJita API in real-time

-- Create skill_names table to cache skill ID to name mappings
CREATE TABLE IF NOT EXISTS skill_names (
  id SERIAL PRIMARY KEY,
  skill_id TEXT NOT NULL UNIQUE,
  skill_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_skill_names_skill_id ON skill_names(skill_id);

-- Insert common BitCraft skills as fallback (these get updated during sync)
INSERT INTO skill_names (skill_id, skill_name) VALUES 
  ('2', 'Fishing'),
  ('3', 'Foraging'), 
  ('4', 'Hunting'),
  ('5', 'Mining'),
  ('6', 'Woodcutting'),
  ('7', 'Cooking'),
  ('8', 'Alchemy'),
  ('9', 'Blacksmithing'),
  ('10', 'Weaving'),
  ('11', 'Masonry'),
  ('12', 'Carpentry'),
  ('13', 'Leatherworking'),
  ('14', 'Farming'),
  ('15', 'Engineering'),
  ('16', 'Pottery'),
  ('17', 'Jewelcrafting'),
  ('18', 'Artificing'),
  ('19', 'Enchanting'),
  ('20', 'Runecrafting'),
  ('21', 'Scribing')
ON CONFLICT (skill_id) DO NOTHING; 