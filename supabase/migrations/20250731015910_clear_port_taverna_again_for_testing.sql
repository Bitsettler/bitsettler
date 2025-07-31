-- Clear Port Taverna settlement again to test full flow with fixed RLS

-- Delete settlement members 
DELETE FROM settlement_members WHERE settlement_id = '504403158277057776';

-- Delete the settlement itself
DELETE FROM settlements_master WHERE id = '504403158277057776';

-- Log the cleanup
SELECT 'Port Taverna T6 cleared again - ready for full establishment flow test' as message;
