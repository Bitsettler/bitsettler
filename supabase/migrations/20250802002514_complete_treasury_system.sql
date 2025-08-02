-- Complete Treasury System Migration
-- Adds missing treasury tables to complete the treasury management system
-- Note: treasury_transactions table already exists from previous migration

-- Treasury Balance History (snapshots of balance over time)
CREATE TABLE treasury_balance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  balance DECIMAL(15,2) NOT NULL,
  change_amount DECIMAL(15,2) NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('Income', 'Expense', 'Adjustment', 'Initial')),
  source TEXT,
  description TEXT,
  transaction_id UUID,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treasury Categories (for organizing transactions)
CREATE TABLE treasury_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('Income', 'Expense', 'Both')),
  description TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treasury Subcategories (for detailed categorization)
CREATE TABLE treasury_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES treasury_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Treasury Summary View (current state)
CREATE TABLE treasury_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_income DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_transaction_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treasury Monthly Summary (aggregated monthly data)
CREATE TABLE treasury_monthly_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_income DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_change DECIMAL(15,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- Insert default treasury categories
INSERT INTO treasury_categories (name, type, description, color) VALUES
  ('Project Revenue', 'Income', 'Income from completed projects and services', '#10B981'),
  ('Member Dues', 'Income', 'Regular contributions from settlement members', '#3B82F6'),
  ('Trading', 'Income', 'Income from trading with other settlements', '#F59E0B'),
  ('Construction Costs', 'Expense', 'Costs for building and infrastructure', '#EF4444'),
  ('Supplies', 'Expense', 'General supplies and materials', '#8B5CF6'),
  ('Tools & Equipment', 'Expense', 'Tools, equipment, and maintenance', '#06B6D4'),
  ('Food & Provisions', 'Expense', 'Food, cooking supplies, and provisions', '#F97316'),
  ('Crafting Materials', 'Expense', 'Materials for crafting and production', '#84CC16'),
  ('Administrative', 'Expense', 'Administrative and management costs', '#6B7280'),
  ('Other Income', 'Income', 'Miscellaneous income sources', '#10B981'),
  ('Other Expenses', 'Expense', 'Miscellaneous expenses', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- Insert default subcategories
INSERT INTO treasury_subcategories (category_id, name, description) 
SELECT 
  tc.id,
  sub.name,
  sub.description
FROM (
  VALUES 
    ('Project Revenue', 'Building Projects', 'Revenue from construction projects'),
    ('Project Revenue', 'Crafting Services', 'Revenue from crafting and production'),
    ('Project Revenue', 'Trading Services', 'Revenue from trading and commerce'),
    ('Member Dues', 'Monthly Dues', 'Regular monthly member contributions'),
    ('Member Dues', 'Initiation Fees', 'One-time fees for new members'),
    ('Trading', 'Resource Sales', 'Sales of resources and materials'),
    ('Trading', 'Crafted Goods', 'Sales of crafted items'),
    ('Construction Costs', 'Building Materials', 'Costs for construction materials'),
    ('Construction Costs', 'Labor Costs', 'Costs for construction labor'),
    ('Supplies', 'General Supplies', 'General settlement supplies'),
    ('Supplies', 'Medical Supplies', 'Medical and health supplies'),
    ('Tools & Equipment', 'New Tools', 'Purchase of new tools'),
    ('Tools & Equipment', 'Maintenance', 'Tool maintenance and repair'),
    ('Food & Provisions', 'Food Supplies', 'Food and cooking ingredients'),
    ('Food & Provisions', 'Preserved Foods', 'Preserved and stored foods'),
    ('Crafting Materials', 'Raw Materials', 'Raw materials for crafting'),
    ('Crafting Materials', 'Crafting Tools', 'Tools specific to crafting'),
    ('Administrative', 'Record Keeping', 'Costs for record keeping and administration'),
    ('Administrative', 'Communication', 'Costs for communication and coordination')
) AS sub(category_name, name, description)
JOIN treasury_categories tc ON tc.name = sub.category_name;

-- Initialize treasury summary with default values
INSERT INTO treasury_summary (current_balance, total_income, total_expenses) 
VALUES (0, 0, 0);

-- Indexes for treasury performance
CREATE INDEX idx_treasury_balance_history_recorded_at ON treasury_balance_history(recorded_at);
CREATE INDEX idx_treasury_balance_history_change_type ON treasury_balance_history(change_type);
CREATE INDEX idx_treasury_categories_type ON treasury_categories(type);
CREATE INDEX idx_treasury_categories_active ON treasury_categories(is_active);
CREATE INDEX idx_treasury_subcategories_category_id ON treasury_subcategories(category_id);
CREATE INDEX idx_treasury_monthly_summary_year_month ON treasury_monthly_summary(year, month);

-- Add comments for documentation
COMMENT ON TABLE treasury_summary IS 'Current treasury state and summary statistics';
COMMENT ON TABLE treasury_balance_history IS 'Historical balance snapshots and changes';
COMMENT ON TABLE treasury_categories IS 'Categories for organizing treasury transactions';
COMMENT ON TABLE treasury_subcategories IS 'Subcategories for detailed transaction classification';
COMMENT ON TABLE treasury_monthly_summary IS 'Monthly aggregated treasury statistics';
