-- Clear all settlement data for fresh demo
-- This preserves all schema, indexes, constraints, and functions
-- Only deletes data for clean testing

-- Start transaction for atomic operation
BEGIN;

-- Clear data in correct order to respect foreign key constraints
-- Only delete from tables that exist

-- 1. Clear settlement member data (main table we know exists)
DELETE FROM settlement_members;

-- 2. Clear settlement master data
DELETE FROM settlements_master;

-- 3. Clear other tables if they exist
DO $$
BEGIN
    -- Clear user_activity if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activity') THEN
        DELETE FROM user_activity;
        RAISE NOTICE 'Cleared user_activity table';
    END IF;
    
    -- Clear settlement_projects if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settlement_projects') THEN
        DELETE FROM settlement_projects;
        RAISE NOTICE 'Cleared settlement_projects table';
    END IF;
    
    -- Clear skill_names if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'skill_names') THEN
        DELETE FROM skill_names;
        RAISE NOTICE 'Cleared skill_names table';
    END IF;
END $$;

-- 7. Clear auth users (this will log out the current user)
-- DELETE FROM auth.users; -- Commented out to keep user logged in

-- Reset any sequences if needed
-- Settlement and member IDs use UUIDs, so no sequences to reset

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully cleared all settlement data for demo!';
    RAISE NOTICE 'Schema preserved: tables, indexes, constraints, functions intact';
    RAISE NOTICE 'User authentication preserved - you will stay logged in';
    RAISE NOTICE 'Ready for fresh settlement establishment flow!';
END $$;

COMMIT;
