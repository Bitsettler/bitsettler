-- Clear Port Taverna one final time to test with working member import

-- Delete settlement members 
DELETE FROM settlement_members WHERE settlement_id = '504403158277057776';

-- Delete the settlement itself
DELETE FROM settlements_master WHERE id = '504403158277057776';

-- Log the cleanup
SELECT 'Port Taverna cleared - ready for FINAL test with working member import!' as message;
