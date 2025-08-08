-- Add settlement_id column to settlement_projects table
-- This migration adds a settlement_id column to link projects to their settlements

-- Add settlement_id column
ALTER TABLE settlement_projects 
ADD COLUMN settlement_id TEXT;

-- Add foreign key constraint to reference settlements_master
-- Note: We're referencing settlements_master(id) since that's where settlement IDs are stored
ALTER TABLE settlement_projects 
ADD CONSTRAINT fk_settlement_projects_settlement_id 
FOREIGN KEY (settlement_id) REFERENCES settlements_master(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_settlement_projects_settlement_id ON settlement_projects(settlement_id);

-- Add comment for documentation
COMMENT ON COLUMN settlement_projects.settlement_id IS 'Settlement identifier linking project to a specific settlement (references settlements_master.id)';

-- Update existing projects to have settlement_id based on the creator's settlement
-- This assumes all existing projects should be linked to the settlement of their creator
UPDATE settlement_projects 
SET settlement_id = (
  SELECT sm.settlement_id 
  FROM settlement_members sm 
  WHERE sm.id = settlement_projects.created_by_member_id
)
WHERE settlement_id IS NULL;

-- Make settlement_id NOT NULL after populating existing data
ALTER TABLE settlement_projects 
ALTER COLUMN settlement_id SET NOT NULL;
