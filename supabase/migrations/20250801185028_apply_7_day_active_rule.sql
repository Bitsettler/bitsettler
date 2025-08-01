-- Apply proper 7-day active rule based on last login timestamps
-- Active = logged in within last 7 days, Inactive = no login or >7 days ago

DO $$
DECLARE
    total_members INTEGER;
    members_with_login INTEGER;
    members_without_login INTEGER;
    active_members INTEGER;
    inactive_members INTEGER;
    sample_record RECORD;
BEGIN
    RAISE NOTICE '=== APPLYING 7-DAY ACTIVE RULE ===';
    
    -- Check current state
    SELECT COUNT(*) INTO total_members 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776';
    
    RAISE NOTICE 'Total members in settlement: %', total_members;
    
    -- Check how many have login timestamps
    SELECT COUNT(*) INTO members_with_login 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' 
      AND last_login_timestamp IS NOT NULL;
    
    SELECT COUNT(*) INTO members_without_login 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' 
      AND last_login_timestamp IS NULL;
    
    RAISE NOTICE 'Members with login data: %, without login data: %', 
        members_with_login, members_without_login;
    
    -- Show sample login timestamps
    FOR sample_record IN 
        SELECT name, last_login_timestamp, 
               EXTRACT(days FROM (NOW() - last_login_timestamp)) as days_since_login
        FROM settlement_members 
        WHERE settlement_id = '504403158277057776' 
          AND last_login_timestamp IS NOT NULL
        ORDER BY last_login_timestamp DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE 'Sample: % logged in % days ago (timestamp: %)', 
            sample_record.name, 
            ROUND(sample_record.days_since_login::numeric, 1), 
            sample_record.last_login_timestamp;
    END LOOP;
    
    -- Apply the 7-day rule
    RAISE NOTICE 'Applying 7-day active rule...';
    
    -- Set inactive: members with no login timestamp OR login >7 days ago
    UPDATE settlement_members 
    SET is_active = false,
        last_synced_at = NOW()
    WHERE settlement_id = '504403158277057776'
      AND (last_login_timestamp IS NULL 
           OR last_login_timestamp < NOW() - INTERVAL '7 days');
    
    -- Set active: members with login ≤7 days ago  
    UPDATE settlement_members 
    SET is_active = true,
        last_synced_at = NOW()
    WHERE settlement_id = '504403158277057776'
      AND last_login_timestamp IS NOT NULL 
      AND last_login_timestamp >= NOW() - INTERVAL '7 days';
    
    -- Final count
    SELECT COUNT(*) INTO active_members 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = true;
    
    SELECT COUNT(*) INTO inactive_members 
    FROM settlement_members 
    WHERE settlement_id = '504403158277057776' AND is_active = false;
    
    RAISE NOTICE '✅ FINAL RESULT:';
    RAISE NOTICE 'Active members (last 7 days): %', active_members;
    RAISE NOTICE 'Inactive members (>7 days or no login): %', inactive_members;
    RAISE NOTICE 'Total: %', active_members + inactive_members;
    
END $$;
