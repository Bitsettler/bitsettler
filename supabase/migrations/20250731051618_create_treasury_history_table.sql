-- Create treasury_history table for tracking settlement treasury balance over time
-- Used by treasury polling service to generate historical charts

CREATE TABLE treasury_history (
  id SERIAL PRIMARY KEY,
  settlement_id TEXT NOT NULL,                   -- References settlements_master.id
  balance BIGINT NOT NULL,                       -- Current treasury balance
  previous_balance BIGINT DEFAULT 0,             -- Previous recorded balance
  change_amount BIGINT DEFAULT 0,                -- Calculated difference
  
  -- Additional settlement data at time of snapshot
  supplies INTEGER,                              -- Settlement supplies
  tier INTEGER,                                  -- Settlement tier
  num_tiles INTEGER,                             -- Number of tiles
  
  -- Metadata
  data_source TEXT DEFAULT 'bitjita_polling',    -- Where this snapshot came from
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_treasury_history_settlement_id ON treasury_history(settlement_id);
CREATE INDEX idx_treasury_history_recorded_at ON treasury_history(recorded_at);
CREATE INDEX idx_treasury_history_settlement_time ON treasury_history(settlement_id, recorded_at DESC);

-- Add foreign key constraint (if settlements_master exists)
-- Note: We use a soft reference since settlements_master might not exist in all environments
-- ALTER TABLE treasury_history ADD CONSTRAINT fk_treasury_history_settlement 
--   FOREIGN KEY (settlement_id) REFERENCES settlements_master(id);

-- Create a function to cleanup old treasury history (older than 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_treasury_history()
RETURNS void AS $$
BEGIN
  DELETE FROM treasury_history 
  WHERE recorded_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for treasury_history
ALTER TABLE treasury_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read treasury history
CREATE POLICY "Allow authenticated users to read treasury history" ON treasury_history
  FOR SELECT TO authenticated USING (true);

-- Only allow service accounts to insert/update treasury history
CREATE POLICY "Allow service accounts to manage treasury history" ON treasury_history
  FOR ALL TO service_role USING (true);

-- Add comment
COMMENT ON TABLE treasury_history IS 'Historical treasury balance snapshots collected by polling service for charting and analytics';
COMMENT ON COLUMN treasury_history.settlement_id IS 'Settlement ID from BitJita (matches settlements_master.id)';
COMMENT ON COLUMN treasury_history.balance IS 'Treasury balance at time of snapshot';
COMMENT ON COLUMN treasury_history.change_amount IS 'Change from previous balance (positive = income, negative = expense)';
COMMENT ON COLUMN treasury_history.data_source IS 'Source of this snapshot (bitjita_polling, manual, etc.)';
