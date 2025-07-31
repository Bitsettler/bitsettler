-- Add simple onboarding completion tracking
-- Using Option A: minimal tracking approach

-- Add onboarding completion timestamp to settlement_members
ALTER TABLE settlement_members 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Update the claim_character function to set completion timestamp
CREATE OR REPLACE FUNCTION claim_character(
  p_supabase_user_id TEXT,
  p_bitjita_user_id TEXT,
  p_member_id UUID,
  p_display_name TEXT DEFAULT NULL
)
RETURNS settlement_members AS $$
DECLARE
  result settlement_members;
BEGIN
  UPDATE settlement_members 
  SET 
    supabase_user_id = p_supabase_user_id,
    bitjita_user_id = p_bitjita_user_id,
    display_name = COALESCE(p_display_name, name),
    app_joined_at = NOW(),
    app_last_active_at = NOW(),
    onboarding_completed_at = NOW()  -- Set completion timestamp
  WHERE id = p_member_id AND supabase_user_id IS NULL -- Only unclaimed characters
  RETURNING * INTO result;
  
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Character not found or already claimed';
  END IF;
  
  RETURN result;
END;
$$ language 'plpgsql';

-- Create view for onboarding analytics (optional, for easy querying)
CREATE OR REPLACE VIEW onboarding_analytics AS
SELECT 
  COUNT(*) as total_users,
  COUNT(onboarding_completed_at) as completed_users,
  ROUND(
    (COUNT(onboarding_completed_at)::numeric / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as completion_rate_percent,
  AVG(
    EXTRACT(EPOCH FROM (onboarding_completed_at - created_at)) / 86400
  ) as avg_days_to_complete
FROM settlement_members 
WHERE supabase_user_id IS NOT NULL; -- Only users who have accounts

-- Grant permissions
GRANT SELECT ON onboarding_analytics TO authenticated;

-- Comments
COMMENT ON COLUMN settlement_members.onboarding_completed_at IS 'Timestamp when user completed onboarding by claiming their character';
COMMENT ON VIEW onboarding_analytics IS 'Simple analytics for onboarding completion rates and timing';
