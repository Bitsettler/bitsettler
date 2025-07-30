-- Create treasury_transactions table
CREATE TABLE treasury_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Income', 'Expense', 'Transfer', 'Adjustment')),
  amount DECIMAL(15,2) NOT NULL,
  category TEXT,
  subcategory TEXT,
  description TEXT NOT NULL,
  related_project_id UUID REFERENCES settlement_projects(id),
  related_member_id UUID REFERENCES settlement_members(id),
  source TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_treasury_transactions_transaction_date ON treasury_transactions(transaction_date);
CREATE INDEX idx_treasury_transactions_category ON treasury_transactions(category);
CREATE INDEX idx_treasury_transactions_type ON treasury_transactions(transaction_type);
CREATE INDEX idx_treasury_transactions_related_project ON treasury_transactions(related_project_id);

-- Insert sample data
INSERT INTO treasury_transactions (transaction_type, amount, category, description) VALUES
  ('Income', 1500.00, 'Project Revenue', 'Settlement construction project payment'),
  ('Income', 500.00, 'Member Dues', 'Monthly member contributions'),
  ('Expense', 250.00, 'Supplies', 'Construction materials purchase'),
  ('Expense', 100.00, 'Food & Provisions', 'Weekly food supplies');

-- Add comment
COMMENT ON TABLE treasury_transactions IS 'Settlement treasury transaction records - all financial activity tied to authenticated settlement members';
COMMENT ON COLUMN treasury_transactions.related_member_id IS 'Links transaction to authenticated settlement member who made it';
