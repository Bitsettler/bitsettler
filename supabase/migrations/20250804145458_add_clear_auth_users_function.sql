-- Add function to clear auth users for testing
-- This allows the testing endpoint to clear all user authentication data

-- Create function to clear auth users (development only)
CREATE OR REPLACE FUNCTION clear_auth_users()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Only allow in development/testing environments
    -- You could add additional environment checks here if needed
    
    -- Count users before deletion
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Clear auth users (this will cascade to related auth tables)
    DELETE FROM auth.users;
    
    -- Return result message
    RETURN FORMAT('Cleared %s auth users for testing', user_count);
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION clear_auth_users() IS 'Testing function to clear all Supabase auth users. Should only be used in development environments.';
