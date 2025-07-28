-- Migration: Treasury History Tracking System
-- This creates a time series system to track treasury balance changes over time

-- Treasury balance history table (time series data)
CREATE TABLE IF NOT EXISTS treasury_history (
  id SERIAL PRIMARY KEY,
  settlement_id TEXT NOT NULL,
  balance BIGINT NOT NULL,
  previous_balance BIGINT,
  change_amount BIGINT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_source TEXT DEFAULT 'bitjita',
  
  -- Additional context
  supplies BIGINT,
  tier INTEGER,
  num_tiles INTEGER,
  
  -- Indexes for efficient querying
  CONSTRAINT treasury_history_settlement_time UNIQUE (settlement_id, recorded_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_treasury_history_settlement_id ON treasury_history(settlement_id);
CREATE INDEX IF NOT EXISTS idx_treasury_history_recorded_at ON treasury_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_treasury_history_settlement_date ON treasury_history(settlement_id, recorded_at DESC);

-- Function to clean up old history (keep only 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_treasury_history()
RETURNS void AS $$
BEGIN
  DELETE FROM treasury_history 
  WHERE recorded_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Insert current treasury state if we have settlement data
-- This will be updated by the polling job
INSERT INTO treasury_history (settlement_id, balance, recorded_at, data_source)
SELECT 
  '504403158277057776' as settlement_id,
  0 as balance,
  NOW() as recorded_at,
  'migration_placeholder' as data_source
ON CONFLICT (settlement_id, recorded_at) DO NOTHING;

COMMENT ON TABLE treasury_history IS 'Time series tracking of settlement treasury balance changes from BitJita';
COMMENT ON COLUMN treasury_history.change_amount IS 'Calculated difference from previous balance';
COMMENT ON COLUMN treasury_history.data_source IS 'Source of the balance data (bitjita, manual, etc)'; 