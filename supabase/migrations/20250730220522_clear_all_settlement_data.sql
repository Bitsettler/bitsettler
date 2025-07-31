-- Clear all settlement data while preserving schema
-- This gives us a clean slate for testing with the new schema structure

-- Delete dependent data first (respecting foreign key constraints)
DELETE FROM user_activity;
DELETE FROM user_calculator_saves; 
DELETE FROM member_contributions;
DELETE FROM project_members;
DELETE FROM project_items;
DELETE FROM treasury_transactions;

-- Delete main tables
DELETE FROM settlement_projects;
DELETE FROM settlement_members;
DELETE FROM skill_names;

-- Clear Supabase auth users (this will cascade to related auth tables)
DELETE FROM auth.users;

-- Data clearing complete - schema preserved for testing
