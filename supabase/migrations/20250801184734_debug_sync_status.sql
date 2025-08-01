-- Debug sync status across settlements to understand the scope of the issue
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== SETTLEMENT SYNC STATUS DEBUG ===';
    
    -- Check your specific settlement
    RAISE NOTICE '';
    RAISE NOTICE 'PORT TAVERNA (504403158277057776) STATUS:';
    
    FOR rec IN 
        SELECT 
            COUNT(*) as total_members,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_members,
            COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_members,
            MAX(last_synced_at) as latest_sync,
            MIN(last_synced_at) as oldest_sync,
            sync_source
        FROM settlement_members 
        WHERE settlement_id = '504403158277057776'
        GROUP BY sync_source
    LOOP
        RAISE NOTICE 'Source: %, Total: %, Active: %, Inactive: %, Latest Sync: %, Oldest Sync: %', 
            rec.sync_source, rec.total_members, rec.active_members, rec.inactive_members, 
            rec.latest_sync, rec.oldest_sync;
    END LOOP;
    
    -- Check if this is a widespread issue
    RAISE NOTICE '';
    RAISE NOTICE 'ALL SETTLEMENTS SUMMARY:';
    
    FOR rec IN 
        SELECT 
            settlement_id,
            COUNT(*) as total_members,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_members,
            MAX(last_synced_at) as latest_sync
        FROM settlement_members 
        GROUP BY settlement_id
        HAVING COUNT(*) > 0
        ORDER BY MAX(last_synced_at) DESC
        LIMIT 5
    LOOP
        RAISE NOTICE 'Settlement: %, Total: %, Active: %, Latest Sync: %', 
            rec.settlement_id, rec.total_members, rec.active_members, rec.latest_sync;
    END LOOP;
    
    -- Check recent sync activity
    RAISE NOTICE '';
    RAISE NOTICE 'RECENT SYNC ACTIVITY (last 7 days):';
    
    SELECT COUNT(*) INTO rec FROM settlement_members 
    WHERE last_synced_at > NOW() - INTERVAL '7 days';
    
    RAISE NOTICE 'Members synced in last 7 days: %', rec;
    
    SELECT COUNT(*) INTO rec FROM settlement_members 
    WHERE last_synced_at > NOW() - INTERVAL '1 day';
    
    RAISE NOTICE 'Members synced in last 24 hours: %', rec;
    
    -- Check what background jobs or processes should be running
    RAISE NOTICE '';
    RAISE NOTICE 'SYNC SOURCE ANALYSIS:';
    
    FOR rec IN 
        SELECT DISTINCT sync_source, COUNT(*) as member_count
        FROM settlement_members 
        GROUP BY sync_source
    LOOP
        RAISE NOTICE 'Sync Source: "%" has % members', rec.sync_source, rec.member_count;
    END LOOP;
    
END $$;
