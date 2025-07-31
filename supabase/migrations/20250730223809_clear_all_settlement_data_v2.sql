-- Clear all settlement and user data while preserving schema
-- This gives a clean database for testing the new onboarding flow
-- All table structures, indexes, constraints, and functions remain intact

-- Delete data in correct order to respect foreign key constraints

-- 1. Clear child tables first
DELETE FROM user_activity;
DELETE FROM user_calculator_saves;  
DELETE FROM member_contributions;
DELETE FROM project_members;
DELETE FROM project_items;
DELETE FROM treasury_transactions;

-- 2. Clear parent settlement tables
DELETE FROM settlement_projects;
DELETE FROM settlement_members;
DELETE FROM settlements_master;

-- 3. Clear reference tables
DELETE FROM skill_names;

-- 4. Clear Supabase auth users (this will cascade to related auth tables)
DELETE FROM auth.users;

-- Log the data clearing
DO $$
BEGIN
    RAISE NOTICE 'Settlement data cleared successfully. All tables are now empty but schema preserved.';
    RAISE NOTICE 'Ready for fresh onboarding flow testing!';
END $$;
