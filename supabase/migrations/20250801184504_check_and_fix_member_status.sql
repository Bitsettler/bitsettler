-- Check and fix member active status
-- First, let's see the current state
DO $$
DECLARE
    total_members INTEGER;
    active_members INTEGER;
    inactive_members INTEGER;
BEGIN
    -- Count current members by status
    SELECT COUNT(*) INTO total_members 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776';
    
    SELECT COUNT(*) INTO active_members 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = true;
    
    SELECT COUNT(*) INTO inactive_members 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = false;
    
    -- Log current state
    RAISE NOTICE 'BEFORE FIX - Total members: %, Active: %, Inactive: %', 
        total_members, active_members, inactive_members;
    
    -- Fix: Set all current settlement members to active
    -- (assuming all current members should be considered active)
    UPDATE settlement_members 
    SET 
        is_active = true,
        last_synced_at = NOW()
    WHERE settlement_id = '504403158277057776';
    
    -- Check counts after fix
    SELECT COUNT(*) INTO active_members 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = true;
    
    SELECT COUNT(*) INTO inactive_members 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = false;
    
    -- Log final state
    RAISE NOTICE 'AFTER FIX - Total members: %, Active: %, Inactive: %', 
        total_members, active_members, inactive_members;
        
END $$;
