-- Add simple auto-incrementing project numbers for user-friendly URLs
-- This replaces the complex short_id system with simple numbers like #1, #2, #3

-- Add project_number column with auto-increment
ALTER TABLE settlement_projects 
ADD COLUMN project_number SERIAL NOT NULL;

-- Make project_number unique within each settlement
-- (Different settlements can have overlapping numbers, but that's fine)
CREATE UNIQUE INDEX idx_settlement_projects_number 
ON settlement_projects(project_number);

-- Add helpful comment
COMMENT ON COLUMN settlement_projects.project_number IS 'Simple auto-incrementing number for user-friendly URLs (1, 2, 3...)';

-- Create index for fast lookups by project number
CREATE INDEX idx_settlement_projects_project_number_lookup 
ON settlement_projects(project_number);

-- Update existing projects to have sequential numbers
-- This will give existing projects numbers starting from 1
DO $$
DECLARE
    proj RECORD;
    counter INTEGER := 1;
BEGIN
    -- Loop through existing projects ordered by creation date
    FOR proj IN 
        SELECT id FROM settlement_projects 
        ORDER BY created_at ASC
    LOOP
        UPDATE settlement_projects 
        SET project_number = counter 
        WHERE id = proj.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Note: We're keeping the UUID id as primary key for internal references
-- The project_number is just for user-facing URLs and display
