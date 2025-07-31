-- Clear Port Taverna to test character selection fix

-- Delete settlement members 
DELETE FROM settlement_members WHERE settlement_id = '504403158277057776';

-- Delete the settlement itself
DELETE FROM settlements_master WHERE id = '504403158277057776';

-- Log the cleanup
SELECT 'Port Taverna cleared - ready to test character selection with proper permissions structure!' as message;
