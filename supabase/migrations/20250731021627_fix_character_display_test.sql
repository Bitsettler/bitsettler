-- Clear Port Taverna to test character display fix
-- Fixed BitJita API field mapping: userName instead of playerName

-- Delete settlement members 
DELETE FROM settlement_members WHERE settlement_id = '504403158277057776';

-- Delete the settlement itself
DELETE FROM settlements_master WHERE id = '504403158277057776';

-- Log the cleanup
SELECT 'Port Taverna cleared - testing character display fix with correct BitJita field mapping!' as message;
