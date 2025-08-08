-- Remove contribution_type column from member_contributions
-- We now rely solely on delivery_method to describe how items were delivered

ALTER TABLE member_contributions
DROP COLUMN IF EXISTS contribution_type;

-- No further changes required; existing policies and queries do not reference this column anymore


