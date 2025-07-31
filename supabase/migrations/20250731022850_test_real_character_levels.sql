-- Clear Port Taverna to test real character levels from BitJita citizens API
-- This will test the integration of roster (permissions) + citizens (stats) APIs

-- Delete settlement members 
DELETE FROM settlement_members WHERE settlement_id = '504403158277057776';

-- Delete the settlement itself
DELETE FROM settlements_master WHERE id = '504403158277057776';

-- Log the cleanup
SELECT 'Port Taverna cleared - ready to test real character levels and professions!' as message;
