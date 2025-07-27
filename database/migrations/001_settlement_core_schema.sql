-- Settlement Management Core Schema
-- Core tables for settlement member management, projects, and contributions

-- Settlement Members table (populated by BitJita scraper)
CREATE TABLE settlement_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bitjita_id TEXT UNIQUE, -- ID from BitJita API
  name TEXT NOT NULL,
  profession TEXT NOT NULL,
  profession_level INTEGER DEFAULT 1,
  last_online TIMESTAMP WITH TIME ZONE,
  join_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member Professions (detailed skill tracking)
CREATE TABLE member_professions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES settlement_members(id) ON DELETE CASCADE,
  profession TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlement Projects table
CREATE TABLE settlement_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  created_by TEXT NOT NULL, -- Officer name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Items (required items for projects)
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
  assigned_member_id UUID REFERENCES settlement_members(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member Contributions tracking
CREATE TABLE member_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES settlement_members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES settlement_projects(id) ON DELETE CASCADE,
  project_item_id UUID REFERENCES project_items(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('Item', 'Crafting', 'Gathering', 'Other')),
  item_name TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  description TEXT,
  contributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Member Assignments
CREATE TABLE project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES settlement_projects(id) ON DELETE CASCADE,
  member_id UUID REFERENCES settlement_members(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Contributor',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, member_id)
);

-- Settlement Configuration
CREATE TABLE settlement_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id TEXT NOT NULL UNIQUE,
  settlement_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System and Scraper Logging
CREATE TABLE scraper_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scraper_type TEXT NOT NULL, -- 'members', 'professions', 'treasury'
  last_run TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  records_updated INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Success' CHECK (status IN ('Success', 'Error', 'Partial')),
  error_message TEXT,
  is_manual BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scraping_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scraper_type TEXT NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_run TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  interval_hours INTEGER DEFAULT 12,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Error')),
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bitjita_api_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_endpoint TEXT NOT NULL,
  request_headers JSONB,
  response_status INTEGER,
  response_data JSONB,
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_settlement_members_bitjita_id ON settlement_members(bitjita_id);
CREATE INDEX idx_settlement_members_profession ON settlement_members(profession);
CREATE INDEX idx_settlement_members_active ON settlement_members(is_active);
CREATE INDEX idx_member_professions_member_id ON member_professions(member_id);
CREATE INDEX idx_member_professions_profession ON member_professions(profession);
CREATE INDEX idx_settlement_projects_status ON settlement_projects(status);
CREATE INDEX idx_settlement_projects_priority ON settlement_projects(priority);
CREATE INDEX idx_project_items_project_id ON project_items(project_id);
CREATE INDEX idx_project_items_status ON project_items(status);
CREATE INDEX idx_project_items_assigned_member_id ON project_items(assigned_member_id);
CREATE INDEX idx_member_contributions_member_id ON member_contributions(member_id);
CREATE INDEX idx_member_contributions_project_id ON member_contributions(project_id);
CREATE INDEX idx_member_contributions_contributed_at ON member_contributions(contributed_at);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_member_id ON project_members(member_id);
CREATE INDEX idx_scraper_log_scraper_type ON scraper_log(scraper_type);
CREATE INDEX idx_scraper_log_created_at ON scraper_log(created_at);
CREATE INDEX idx_scraping_schedules_scraper_type ON scraping_schedules(scraper_type);
CREATE INDEX idx_scraping_schedules_is_active ON scraping_schedules(is_active);
CREATE INDEX idx_scraping_schedules_next_run ON scraping_schedules(next_run);

-- Updated trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_settlement_members_updated_at BEFORE UPDATE ON settlement_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_member_professions_updated_at BEFORE UPDATE ON member_professions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settlement_projects_updated_at BEFORE UPDATE ON settlement_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_items_updated_at BEFORE UPDATE ON project_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settlement_config_updated_at BEFORE UPDATE ON settlement_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 