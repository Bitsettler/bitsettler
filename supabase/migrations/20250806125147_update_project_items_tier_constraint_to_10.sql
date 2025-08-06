-- Update tier constraint to allow tiers 1-10 to match brico's tier system
-- Remove the old constraint and add a new one that allows tiers 1-10

ALTER TABLE project_items 
DROP CONSTRAINT IF EXISTS project_items_tier_check;

ALTER TABLE project_items 
ADD CONSTRAINT project_items_tier_check 
CHECK (tier >= 1 AND tier <= 10);
