-- Clear Port Taverna to test database-only character selection
-- Fixed architecture: BitJita -> Database -> Frontend (never hit BitJita after establishment)

-- Delete settlement members 
DELETE FROM settlement_members WHERE settlement_id = '504403158277057776';

-- Delete the settlement itself
DELETE FROM settlements_master WHERE id = '504403158277057776';

-- Log the cleanup
SELECT 'Port Taverna cleared - testing database-only character selection architecture!' as message;
