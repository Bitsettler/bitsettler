-- Clear specific settlement: Port Taverna T6 (504403158277057776)
-- This allows testing the full establishment flow from scratch

-- Delete settlement members (this is the main table we work with)
DELETE FROM settlement_members WHERE settlement_id = '504403158277057776';

-- Finally delete the settlement itself
DELETE FROM settlements_master WHERE id = '504403158277057776';

-- Log the cleanup
SELECT 'Port Taverna T6 settlement cleared for testing' as message;
