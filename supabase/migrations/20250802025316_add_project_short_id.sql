-- Add short_id support for settlement_projects to enable shorter URLs
-- Instead of using full UUIDs like 8dd13d59-9377-4218-8f7b-5513f4065767
-- We'll have short IDs like: proj_a1b2c3 (10 characters total)

-- Add short_id column to settlement_projects
ALTER TABLE settlement_projects 
ADD COLUMN short_id TEXT UNIQUE;

-- Create function to generate short project IDs
CREATE OR REPLACE FUNCTION generate_project_short_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        -- Generate a random 6-character string (letters and numbers)
        new_id := 'proj_' || lower(
            substring(encode(gen_random_bytes(4), 'hex') from 1 for 6)
        );
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM settlement_projects WHERE short_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Could not generate unique short_id after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate short_id for new projects
CREATE OR REPLACE FUNCTION auto_generate_project_short_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_id IS NULL THEN
        NEW.short_id := generate_project_short_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to settlement_projects
CREATE TRIGGER trigger_auto_generate_project_short_id
    BEFORE INSERT ON settlement_projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_project_short_id();

-- Generate short_ids for existing projects
UPDATE settlement_projects 
SET short_id = generate_project_short_id()
WHERE short_id IS NULL;

-- Make short_id NOT NULL now that all existing records have values
ALTER TABLE settlement_projects 
ALTER COLUMN short_id SET NOT NULL;

-- Create index for performance on short_id lookups
CREATE INDEX idx_settlement_projects_short_id ON settlement_projects(short_id);

-- Add comment explaining the short_id format
COMMENT ON COLUMN settlement_projects.short_id IS 'Short URL-friendly identifier in format: proj_xxxxxx (10 chars total)';
