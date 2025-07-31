-- Bulk invite code generation for settlement imports
-- Handles the "big initial pull" scenario and subsequent updates

-- Function to generate invite codes for multiple settlements at once
CREATE OR REPLACE FUNCTION generate_bulk_invite_codes(
    p_batch_size INTEGER DEFAULT 100,
    p_generated_by TEXT DEFAULT 'system'
) RETURNS TABLE(
    settlement_id TEXT,
    invite_code TEXT,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    settlement_record RECORD;
    new_code TEXT;
    attempts INTEGER;
    max_attempts INTEGER := 100;
    processed_count INTEGER := 0;
BEGIN
    -- Process settlements that don't have invite codes yet
    FOR settlement_record IN 
        SELECT id, name 
        FROM settlements_master 
        WHERE invite_code IS NULL 
        AND is_active = true
        ORDER BY created_at ASC
        LIMIT p_batch_size
    LOOP
        -- Generate unique code for this settlement
        attempts := 0;
        new_code := NULL;
        
        LOOP
            attempts := attempts + 1;
            new_code := generate_invite_code();
            
            -- Check if code is unique
            IF NOT EXISTS (SELECT 1 FROM settlements_master WHERE invite_code = new_code) THEN
                EXIT; -- Code is unique, use it
            END IF;
            
            -- Prevent infinite loop
            IF attempts >= max_attempts THEN
                -- Return failure for this settlement
                settlement_id := settlement_record.id;
                invite_code := NULL;
                success := false;
                error_message := 'Failed to generate unique code after ' || max_attempts || ' attempts';
                RETURN NEXT;
                CONTINUE; -- Move to next settlement
            END IF;
        END LOOP;
        
        -- Update settlement with new invite code
        BEGIN
            UPDATE settlements_master 
            SET 
                invite_code = new_code,
                invite_code_generated_by = p_generated_by,
                invite_code_generated_at = NOW(),
                updated_at = NOW()
            WHERE id = settlement_record.id;
            
            -- Return success
            settlement_id := settlement_record.id;
            invite_code := new_code;
            success := true;
            error_message := NULL;
            RETURN NEXT;
            
            processed_count := processed_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Return failure if update failed
            settlement_id := settlement_record.id;
            invite_code := NULL;
            success := false;
            error_message := 'Database error: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
    
    -- Log completion
    RAISE NOTICE 'Bulk invite code generation completed. Processed % settlements.', processed_count;
    
END;
$$ LANGUAGE plpgsql;

-- Function to check and generate codes for settlements missing them
CREATE OR REPLACE FUNCTION ensure_all_settlements_have_invite_codes()
RETURNS TABLE(
    total_settlements INTEGER,
    settlements_needing_codes INTEGER,
    codes_generated INTEGER,
    failed_generations INTEGER
) AS $$
DECLARE
    batch_result RECORD;
    total_count INTEGER;
    missing_count INTEGER;
    generated_count INTEGER := 0;
    failed_count INTEGER := 0;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO total_count FROM settlements_master WHERE is_active = true;
    SELECT COUNT(*) INTO missing_count FROM settlements_master WHERE invite_code IS NULL AND is_active = true;
    
    -- Generate codes in batches to avoid overwhelming the system
    WHILE EXISTS (SELECT 1 FROM settlements_master WHERE invite_code IS NULL AND is_active = true) LOOP
        -- Process batch
        FOR batch_result IN 
            SELECT * FROM generate_bulk_invite_codes(50, 'bulk_import_system')
        LOOP
            IF batch_result.success THEN
                generated_count := generated_count + 1;
            ELSE
                failed_count := failed_count + 1;
                RAISE WARNING 'Failed to generate invite code for settlement %: %', 
                    batch_result.settlement_id, batch_result.error_message;
            END IF;
        END LOOP;
        
        -- Safety break if nothing was processed in this batch
        IF NOT FOUND THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Return results
    total_settlements := total_count;
    settlements_needing_codes := missing_count;
    codes_generated := generated_count;
    failed_generations := failed_count;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_bulk_invite_codes(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_all_settlements_have_invite_codes() TO authenticated;

-- Comments
COMMENT ON FUNCTION generate_bulk_invite_codes IS 'Generates unique invite codes for multiple settlements in batch. Useful for bulk imports.';
COMMENT ON FUNCTION ensure_all_settlements_have_invite_codes IS 'Ensures all active settlements have invite codes. Use after bulk settlement imports.';
