-- Add delivery_method column to member_contributions table
-- This tracks how items are delivered (Dropbox, Officer Handoff, etc.)

ALTER TABLE member_contributions 
ADD COLUMN delivery_method TEXT DEFAULT 'Dropbox' 
CHECK (delivery_method IN ('Dropbox', 'Officer Handoff', 'Added to Building', 'Other'));

-- Add index for performance
CREATE INDEX idx_member_contributions_delivery_method ON member_contributions(delivery_method);

-- Update existing contributions to have default delivery method
UPDATE member_contributions 
SET delivery_method = 'Dropbox' 
WHERE delivery_method IS NULL;

-- Make the column NOT NULL now that all existing records have a value
ALTER TABLE member_contributions 
ALTER COLUMN delivery_method SET NOT NULL;

-- Add comment
COMMENT ON COLUMN member_contributions.delivery_method IS 'How the contribution was delivered to the project';
