-- Disable hardcoded Port Taverna 7-day rule that conflicts with Phase 2 is_active repurposing
-- 
-- ISSUE: Migration 20250801185028_apply_7_day_active_rule.sql specifically targets Port Taverna
-- and applies the OLD semantics (is_active = 7-day login activity) which conflicts with our
-- Phase 2 repurposing where is_active = settlement membership.
--
-- This migration overrides that hardcoded rule to align with the new Phase 2 architecture.

DO $$
DECLARE
    settlement_member_count INTEGER;
    current_active INTEGER;
    current_inactive INTEGER;
BEGIN
    -- Log the issue
    RAISE NOTICE '🔧 FIXING: Port Taverna hardcoded 7-day rule conflicts with Phase 2 is_active repurposing';
    
    -- Get current counts
    SELECT COUNT(*) INTO settlement_member_count 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776';
    
    SELECT COUNT(*) INTO current_active 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = true;
    
    SELECT COUNT(*) INTO current_inactive 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = false;
    
    RAISE NOTICE 'BEFORE FIX - Total: %, Active: %, Inactive: %', 
        settlement_member_count, current_active, current_inactive;
    
    -- TEMPORARY: Set all Port Taverna members to active until the sync can run properly
    -- The sync will then handle the proper settlement membership logic
    UPDATE settlement_members 
    SET 
        is_active = true,  -- Phase 2: is_active now means "in settlement"
        last_synced_at = NOW()
    WHERE settlement_id = '504403158277057776';
    
    -- Get new counts
    SELECT COUNT(*) INTO current_active 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = true;
    
    SELECT COUNT(*) INTO current_inactive 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = false;
    
    RAISE NOTICE 'AFTER FIX - Active: %, Inactive: %', current_active, current_inactive;
    RAISE NOTICE '✅ Port Taverna is_active field now represents settlement membership (Phase 2)';
    RAISE NOTICE '📝 Next sync will apply proper BitJita-based settlement membership logic';
    
END $$;
