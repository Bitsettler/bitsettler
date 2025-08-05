-- Add Discord link support to settlements_master table
-- This allows settlement owners to set a Discord server link for their members

-- Add discord_link column to settlements_master table
ALTER TABLE settlements_master 
ADD COLUMN discord_link TEXT;

-- Add validation to ensure discord links are properly formatted
ALTER TABLE settlements_master 
ADD CONSTRAINT check_discord_link_format 
CHECK (
  discord_link IS NULL OR 
  discord_link ~ '^https?://discord\.(gg|com)/.+$' OR
  discord_link ~ '^https://discord\.gg/[A-Za-z0-9]+$'
);

-- Add comment for documentation
COMMENT ON COLUMN settlements_master.discord_link IS 'Discord server invite link set by settlement owners/officers for community access';
