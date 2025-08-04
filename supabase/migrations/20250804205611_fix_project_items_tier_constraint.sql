-- Fix tier constraint to allow BitCraft tier 6 items
-- Remove the old constraint and add a new one that allows tiers 1-6

ALTER TABLE project_items 
DROP CONSTRAINT project_items_tier_check;

ALTER TABLE project_items 
ADD CONSTRAINT project_items_tier_check 
CHECK (tier >= 1 AND tier <= 6);
