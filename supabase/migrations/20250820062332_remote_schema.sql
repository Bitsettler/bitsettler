

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auto_generate_project_short_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.short_id IS NULL THEN
        NEW.short_id := generate_project_short_id();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_project_short_id"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."settlement_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_entity_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "skills" "jsonb" DEFAULT '{}'::"jsonb",
    "total_skills" integer DEFAULT 0,
    "highest_level" integer DEFAULT 0,
    "total_level" integer DEFAULT 0,
    "total_xp" bigint DEFAULT 0,
    "top_profession" "text",
    "last_login_timestamp" timestamp with time zone,
    "joined_settlement_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "supabase_user_id" "text",
    "display_name" "text",
    "discord_handle" "text",
    "bio" "text",
    "timezone" "text",
    "preferred_contact" "text" DEFAULT 'discord'::"text",
    "theme" "text" DEFAULT 'system'::"text",
    "profile_color" "text" DEFAULT '#3b82f6'::"text",
    "default_settlement_view" "text" DEFAULT 'dashboard'::"text",
    "notifications_enabled" boolean DEFAULT true,
    "activity_tracking_enabled" boolean DEFAULT true,
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    "sync_source" "text" DEFAULT 'bitjita'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "onboarding_completed_at" timestamp with time zone,
    "primary_profession" "text",
    "secondary_profession" "text",
    "avatar_url" "text",
    "is_solo" boolean DEFAULT false,
    CONSTRAINT "settlement_members_auth_user_id_uuid_check" CHECK ((("supabase_user_id" IS NULL) OR ("supabase_user_id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::"text"))),
    CONSTRAINT "settlement_members_preferred_contact_check" CHECK (("preferred_contact" = ANY (ARRAY['discord'::"text", 'in-game'::"text", 'app'::"text"]))),
    CONSTRAINT "settlement_members_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."settlement_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."settlement_members" IS 'Unified settlement members - game data, skills, and app users all in one table';



COMMENT ON COLUMN "public"."settlement_members"."player_entity_id" IS 'PRIMARY: BitJita player character ID - stable, recommended by devs, never changes';



COMMENT ON COLUMN "public"."settlement_members"."skills" IS 'Skills data as JSONB {skillName: level} format from BitJita API';



COMMENT ON COLUMN "public"."settlement_members"."total_skills" IS 'Auto-calculated count of skills with level > 0';



COMMENT ON COLUMN "public"."settlement_members"."top_profession" IS 'Auto-calculated highest skill profession (used as fallback if primary_profession not set)';



COMMENT ON COLUMN "public"."settlement_members"."is_active" IS 'REPURPOSED: Now indicates if member is currently in settlement (from BitJita API). 
Use last_login_timestamp and utility functions for activity calculations.
Historical note: Previously indicated 7-day login activity.';



COMMENT ON COLUMN "public"."settlement_members"."supabase_user_id" IS 'Supabase Auth user ID - NULL means character not claimed by app user yet';



COMMENT ON COLUMN "public"."settlement_members"."display_name" IS 'App display name - defaults to game name but user can customize';



COMMENT ON COLUMN "public"."settlement_members"."onboarding_completed_at" IS 'Timestamp when user completed onboarding by claiming their character';



COMMENT ON COLUMN "public"."settlement_members"."primary_profession" IS 'User-selected primary profession (overrides calculated top_profession)';



COMMENT ON COLUMN "public"."settlement_members"."secondary_profession" IS 'User-selected secondary profession';



CREATE OR REPLACE FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_bitjita_user_id" "text", "p_member_id" "uuid", "p_display_name" "text" DEFAULT NULL::"text") RETURNS "public"."settlement_members"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_bitjita_user_id" "text", "p_member_id" "uuid", "p_display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_member_id" "uuid", "p_bitjita_user_id" "text", "p_display_name" "text" DEFAULT NULL::"text") RETURNS "public"."settlement_members"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result settlement_members;
BEGIN
  UPDATE settlement_members 
  SET 
    supabase_user_id = p_supabase_user_id,
    bitjita_user_id = p_bitjita_user_id,
    display_name = COALESCE(p_display_name, name),
    app_joined_at = NOW(),
    app_last_active_at = NOW()
  WHERE id = p_member_id AND supabase_user_id IS NULL -- Only unclaimed characters
  RETURNING * INTO result;
  
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Character not found or already claimed';
  END IF;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_member_id" "uuid", "p_bitjita_user_id" "text", "p_display_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_member_id" "uuid", "p_bitjita_user_id" "text", "p_display_name" "text") IS 'Links Supabase Auth user to their settlement character with BitJita user ID for API integration';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_treasury_history"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM treasury_history 
  WHERE recorded_at < NOW() - INTERVAL '6 months';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_treasury_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_auth_users"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Only allow in development/testing environments
    -- You could add additional environment checks here if needed
    
    -- Count users before deletion
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Clear auth users (this will cascade to related auth tables)
    DELETE FROM auth.users;
    
    -- Return result message
    RETURN FORMAT('Cleared %s auth users for testing', user_count);
END;
$$;


ALTER FUNCTION "public"."clear_auth_users"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clear_auth_users"() IS 'Testing function to clear all Supabase auth users. Should only be used in development environments.';



CREATE OR REPLACE FUNCTION "public"."create_settlement_invite_code"("p_settlement_id" "text", "p_generated_by" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Generate unique code
    new_code := generate_unique_invite_code();
    
    -- Update settlement with new invite code
    UPDATE settlements_master 
    SET 
        invite_code = new_code,
        invite_code_generated_by = p_generated_by,
        invite_code_generated_at = NOW(),
        invite_code_last_regenerated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_settlement_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Settlement with ID % not found', p_settlement_id;
    END IF;
    
    RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."create_settlement_invite_code"("p_settlement_id" "text", "p_generated_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_all_settlements_have_invite_codes"() RETURNS TABLE("total_settlements" integer, "settlements_needing_codes" integer, "codes_generated" integer, "failed_generations" integer)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."ensure_all_settlements_have_invite_codes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ensure_all_settlements_have_invite_codes"() IS 'Ensures all active settlements have invite codes. Use after bulk settlement imports.';



CREATE OR REPLACE FUNCTION "public"."generate_bulk_invite_codes"("p_batch_size" integer DEFAULT 100, "p_generated_by" "text" DEFAULT 'system'::"text") RETURNS TABLE("settlement_id" "text", "invite_code" "text", "success" boolean, "error_message" "text")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_bulk_invite_codes"("p_batch_size" integer, "p_generated_by" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_bulk_invite_codes"("p_batch_size" integer, "p_generated_by" "text") IS 'Generates unique invite codes for multiple settlements in batch. Useful for bulk imports.';



CREATE OR REPLACE FUNCTION "public"."generate_invite_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    letters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    numbers TEXT := '23456789';
    code TEXT := '';
    i INTEGER;
BEGIN
    -- Generate 3 letters
    FOR i IN 1..3 LOOP
        code := code || substr(letters, floor(random() * length(letters) + 1)::integer, 1);
    END LOOP;
    
    -- Generate 3 numbers  
    FOR i IN 1..3 LOOP
        code := code || substr(numbers, floor(random() * length(numbers) + 1)::integer, 1);
    END LOOP;
    
    RETURN code;
END;
$$;


ALTER FUNCTION "public"."generate_invite_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_project_short_id"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_id TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        -- Generate a random 6-character string (letters and numbers)
        new_id := 'proj_' || lower(
            substring(encode(gen_random_bytes(4), 'hex') from 1 for 6)
        );
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM settlement_projects WHERE short_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Could not generate unique short_id after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_project_short_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_invite_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_code TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        new_code := generate_invite_code();
        attempts := attempts + 1;
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM settlements_master WHERE invite_code = new_code) THEN
            RETURN new_code;
        END IF;
        
        -- Prevent infinite loop
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique invite code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_unique_invite_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_activity_status"("last_login_timestamp" timestamp with time zone) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  IF last_login_timestamp IS NULL THEN
    RETURN 'never_logged_in';
  END IF;
  
  IF last_login_timestamp > (NOW() - INTERVAL '1 day') THEN
    RETURN 'very_active';
  ELSIF last_login_timestamp > (NOW() - INTERVAL '3 days') THEN
    RETURN 'active';
  ELSIF last_login_timestamp > (NOW() - INTERVAL '7 days') THEN
    RETURN 'recently_active';
  ELSIF last_login_timestamp > (NOW() - INTERVAL '30 days') THEN
    RETURN 'inactive';
  ELSE
    RETURN 'very_inactive';
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_activity_status"("last_login_timestamp" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_activity_status"("last_login_timestamp" timestamp with time zone) IS 'Returns human-readable activity status based on last login timestamp.';



CREATE OR REPLACE FUNCTION "public"."get_user_settlement_id"("user_id_param" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  settlement_id_result TEXT;
BEGIN
  SELECT settlement_id INTO settlement_id_result
  FROM settlement_members 
  WHERE supabase_user_id = COALESCE(user_id_param, auth.uid()::text)
  AND is_active = true
  LIMIT 1;
  
  RETURN settlement_id_result;
END;
$$;


ALTER FUNCTION "public"."get_user_settlement_id"("user_id_param" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_settlement_id"("user_id_param" "text") IS 'Helper function to get the settlement ID for a specific user';



CREATE OR REPLACE FUNCTION "public"."get_user_settlement_permissions"("settlement_id_param" "text", "user_id_param" "text" DEFAULT NULL::"text") RETURNS TABLE("inventory_permission" integer, "build_permission" integer, "officer_permission" integer, "co_owner_permission" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.inventory_permission,
    sm.build_permission,
    sm.officer_permission,
    sm.co_owner_permission
  FROM settlement_members sm
  WHERE sm.settlement_id = settlement_id_param
  AND sm.supabase_user_id = COALESCE(user_id_param, auth.uid()::text)
  AND sm.is_active = true;
END;
$$;


ALTER FUNCTION "public"."get_user_settlement_permissions"("settlement_id_param" "text", "user_id_param" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_settlement_permissions"("settlement_id_param" "text", "user_id_param" "text") IS 'Get user permission levels for a settlement';



CREATE OR REPLACE FUNCTION "public"."has_settlement_management_permission"("settlement_id_param" "text", "user_id_param" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM settlement_members 
    WHERE settlement_id = settlement_id_param
    AND supabase_user_id = COALESCE(user_id_param, auth.uid()::text)
    AND is_active = true
    AND (officer_permission > 0 OR co_owner_permission > 0)
  );
END;
$$;


ALTER FUNCTION "public"."has_settlement_management_permission"("settlement_id_param" "text", "user_id_param" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_settlement_management_permission"("settlement_id_param" "text", "user_id_param" "text") IS 'Check if user has officer or co-owner permissions';



CREATE OR REPLACE FUNCTION "public"."is_recently_active"("last_login_timestamp" timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Handle null timestamps
  IF last_login_timestamp IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if login was within last 7 days
  RETURN last_login_timestamp > (NOW() - INTERVAL '7 days');
END;
$$;


ALTER FUNCTION "public"."is_recently_active"("last_login_timestamp" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_recently_active"("last_login_timestamp" timestamp with time zone) IS 'Checks if a member logged in within the last 7 days. Replaces is_active boolean for activity checks.';



CREATE OR REPLACE FUNCTION "public"."is_settlement_member"("settlement_id_param" "text", "user_id_param" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM settlement_members 
    WHERE settlement_id = settlement_id_param
    AND supabase_user_id = COALESCE(user_id_param, auth.uid()::text)
    AND is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."is_settlement_member"("settlement_id_param" "text", "user_id_param" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_settlement_member"("settlement_id_param" "text", "user_id_param" "text") IS 'Check if user is member of a specific settlement';



CREATE OR REPLACE FUNCTION "public"."is_settlement_member_of"("settlement_id_param" "text", "user_id_param" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM settlement_members 
    WHERE settlement_id = settlement_id_param
    AND supabase_user_id = COALESCE(user_id_param, auth.uid()::text)
    AND is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."is_settlement_member_of"("settlement_id_param" "text", "user_id_param" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_settlement_member_of"("settlement_id_param" "text", "user_id_param" "text") IS 'Helper function to check if a user is a member of a specific settlement';



CREATE OR REPLACE FUNCTION "public"."regenerate_settlement_invite_code"("p_settlement_id" "text", "p_regenerated_by" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Generate unique code
    new_code := generate_unique_invite_code();
    
    -- Update settlement with new invite code
    UPDATE settlements_master 
    SET 
        invite_code = new_code,
        invite_code_generated_by = p_regenerated_by,
        invite_code_last_regenerated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_settlement_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Settlement with ID % not found', p_settlement_id;
    END IF;
    
    RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."regenerate_settlement_invite_code"("p_settlement_id" "text", "p_regenerated_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_member_skills_aggregation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Calculate aggregated skills data from skills JSONB
    IF NEW.skills IS NOT NULL AND NEW.skills != '{}' THEN
        -- Count total skills (non-zero values)
        SELECT COUNT(*)
        INTO NEW.total_skills
        FROM jsonb_each_text(NEW.skills)
        WHERE value::integer > 0;
        
        -- Calculate total level (sum of all skill levels)
        SELECT COALESCE(SUM(value::integer), 0)
        INTO NEW.total_level
        FROM jsonb_each_text(NEW.skills);
        
        -- Find highest level
        SELECT COALESCE(MAX(value::integer), 0)
        INTO NEW.highest_level
        FROM jsonb_each_text(NEW.skills);
        
        -- Find top profession (highest skill)
        SELECT key INTO NEW.top_profession
        FROM jsonb_each_text(NEW.skills)
        ORDER BY value::integer DESC
        LIMIT 1;
        
        -- Calculate estimated total XP (simplified calculation)
        -- This is an approximation - real XP calculation would need game formulas
        NEW.total_xp = NEW.total_level * 100;
    ELSE
        -- No skills data
        NEW.total_skills = 0;
        NEW.total_level = 0;
        NEW.highest_level = 0;
        NEW.total_xp = 0;
        NEW.top_profession = 'Unknown';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_member_skills_aggregation"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_member_skills_aggregation"() IS 'Auto-calculates skills totals when skills JSONB changes';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_contributions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "member_id" "uuid",
    "item_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "notes" "text",
    "contributed_at" timestamp with time zone DEFAULT "now"(),
    "delivery_method" "text" DEFAULT 'Dropbox'::"text" NOT NULL,
    CONSTRAINT "member_contributions_delivery_method_check" CHECK (("delivery_method" = ANY (ARRAY['Dropbox'::"text", 'Officer Handoff'::"text", 'Added to Building'::"text", 'Other'::"text"]))),
    CONSTRAINT "member_contributions_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."member_contributions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."member_contributions"."delivery_method" IS 'How the contribution was delivered to the project';



CREATE OR REPLACE VIEW "public"."onboarding_analytics" AS
 SELECT "count"(*) AS "total_users",
    "count"("onboarding_completed_at") AS "completed_users",
    "round"(((("count"("onboarding_completed_at"))::numeric / (NULLIF("count"(*), 0))::numeric) * (100)::numeric), 2) AS "completion_rate_percent",
    "avg"((EXTRACT(epoch FROM ("onboarding_completed_at" - "created_at")) / (86400)::numeric)) AS "avg_days_to_complete"
   FROM "public"."settlement_members"
  WHERE ("supabase_user_id" IS NOT NULL);


ALTER VIEW "public"."onboarding_analytics" OWNER TO "postgres";


COMMENT ON VIEW "public"."onboarding_analytics" IS 'Simple analytics for onboarding completion rates and timing';



CREATE TABLE IF NOT EXISTS "public"."project_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "item_name" "text" NOT NULL,
    "required_quantity" integer NOT NULL,
    "current_quantity" integer DEFAULT 0 NOT NULL,
    "tier" integer DEFAULT 1,
    "priority" integer DEFAULT 3,
    "rank_order" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'Needed'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_items_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 5))),
    CONSTRAINT "project_items_required_quantity_check" CHECK (("required_quantity" > 0)),
    CONSTRAINT "project_items_status_check" CHECK (("status" = ANY (ARRAY['Needed'::"text", 'In Progress'::"text", 'Completed'::"text"]))),
    CONSTRAINT "project_items_tier_check" CHECK ((("tier" >= 1) AND ("tier" <= 10)))
);


ALTER TABLE "public"."project_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "member_id" "uuid",
    "role" "text" DEFAULT 'Contributor'::"text",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_members_role_check" CHECK (("role" = ANY (ARRAY['Leader'::"text", 'Contributor'::"text", 'Observer'::"text"])))
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settlement_members_memberships" (
    "player_entity_id" "text" NOT NULL,
    "settlement_id" "text" NOT NULL,
    "is_owner" boolean DEFAULT false NOT NULL,
    "inventory_permission" smallint DEFAULT 0 NOT NULL,
    "build_permission" smallint DEFAULT 0 NOT NULL,
    "officer_permission" smallint DEFAULT 0 NOT NULL,
    "co_owner_permission" smallint DEFAULT 0 NOT NULL,
    "is_claim" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."settlement_members_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settlement_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "priority" integer DEFAULT 3,
    "created_by_member_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "short_id" "text" NOT NULL,
    "project_number" integer NOT NULL,
    "settlement_id" "text" NOT NULL,
    CONSTRAINT "settlement_projects_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 5))),
    CONSTRAINT "settlement_projects_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Completed'::"text", 'Cancelled'::"text"])))
);


ALTER TABLE "public"."settlement_projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."settlement_projects"."short_id" IS 'Short URL-friendly identifier in format: proj_xxxxxx (10 chars total)';



COMMENT ON COLUMN "public"."settlement_projects"."project_number" IS 'Simple auto-incrementing number for user-friendly URLs (1, 2, 3...)';



COMMENT ON COLUMN "public"."settlement_projects"."settlement_id" IS 'Settlement identifier linking project to a specific settlement (references settlements_master.id)';



CREATE SEQUENCE IF NOT EXISTS "public"."settlement_projects_project_number_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."settlement_projects_project_number_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."settlement_projects_project_number_seq" OWNED BY "public"."settlement_projects"."project_number";



CREATE TABLE IF NOT EXISTS "public"."settlements_master" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "tier" integer DEFAULT 0,
    "treasury" bigint DEFAULT 0,
    "supplies" integer DEFAULT 0,
    "tiles" integer DEFAULT 0,
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    "sync_source" "text" DEFAULT 'bitjita'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "building_maintenance" integer DEFAULT 0,
    "location_x" integer,
    "location_z" integer,
    "location_dimension" integer,
    "region_id" integer,
    "region_name" "text",
    "owner_player_entity_id" "text",
    "owner_building_entity_id" "text",
    "neutral" boolean DEFAULT false,
    "learned_techs" "jsonb" DEFAULT '[]'::"jsonb",
    "researching" integer DEFAULT 0,
    "research_start_timestamp" timestamp with time zone,
    "bitjita_created_at" timestamp with time zone,
    "bitjita_updated_at" timestamp with time zone,
    "discord_link" "text",
    "is_established" boolean DEFAULT false,
    CONSTRAINT "check_discord_link_format" CHECK ((("discord_link" IS NULL) OR ("discord_link" ~ '^https?://discord\.(gg|com)/.+$'::"text") OR ("discord_link" ~ '^https://discord\.gg/[A-Za-z0-9]+$'::"text")))
);


ALTER TABLE "public"."settlements_master" OWNER TO "postgres";


COMMENT ON TABLE "public"."settlements_master" IS 'Master list of all settlements with complete BitJita data for fast local search and future features';



COMMENT ON COLUMN "public"."settlements_master"."building_maintenance" IS 'Cost to maintain settlement buildings (from BitJita)';



COMMENT ON COLUMN "public"."settlements_master"."location_x" IS 'Settlement X coordinate in game world';



COMMENT ON COLUMN "public"."settlements_master"."location_z" IS 'Settlement Z coordinate in game world';



COMMENT ON COLUMN "public"."settlements_master"."location_dimension" IS 'Which dimension/world layer the settlement is in';



COMMENT ON COLUMN "public"."settlements_master"."region_id" IS 'BitJita region ID (e.g. 9 for Zepharel)';



COMMENT ON COLUMN "public"."settlements_master"."region_name" IS 'Human-readable region name (e.g. "Zepharel")';



COMMENT ON COLUMN "public"."settlements_master"."owner_player_entity_id" IS 'BitJita entity ID of settlement owner';



COMMENT ON COLUMN "public"."settlements_master"."owner_building_entity_id" IS 'BitJita entity ID of owner building';



COMMENT ON COLUMN "public"."settlements_master"."neutral" IS 'Whether settlement is neutral (not player-owned)';



COMMENT ON COLUMN "public"."settlements_master"."learned_techs" IS 'Array of learned technology IDs from BitJita';



COMMENT ON COLUMN "public"."settlements_master"."researching" IS 'Currently researching technology ID (0 = none)';



COMMENT ON COLUMN "public"."settlements_master"."research_start_timestamp" IS 'When current research started';



COMMENT ON COLUMN "public"."settlements_master"."bitjita_created_at" IS 'Settlement creation time from BitJita';



COMMENT ON COLUMN "public"."settlements_master"."bitjita_updated_at" IS 'Last update time from BitJita';



COMMENT ON COLUMN "public"."settlements_master"."discord_link" IS 'Discord server invite link set by settlement owners/officers for community access';



CREATE TABLE IF NOT EXISTS "public"."skill_names" (
    "skill_id" "text" NOT NULL,
    "skill_name" "text" NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."skill_names" OWNER TO "postgres";


COMMENT ON TABLE "public"."skill_names" IS 'Reference table mapping skill IDs to readable names';



CREATE TABLE IF NOT EXISTS "public"."treasury_balance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "balance" numeric(15,2) NOT NULL,
    "change_amount" numeric(15,2) NOT NULL,
    "change_type" "text" NOT NULL,
    "source" "text",
    "description" "text",
    "transaction_id" "uuid",
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "treasury_balance_history_change_type_check" CHECK (("change_type" = ANY (ARRAY['Income'::"text", 'Expense'::"text", 'Adjustment'::"text", 'Initial'::"text"])))
);


ALTER TABLE "public"."treasury_balance_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."treasury_balance_history" IS 'Historical balance snapshots and changes';



CREATE TABLE IF NOT EXISTS "public"."treasury_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "color" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "treasury_categories_type_check" CHECK (("type" = ANY (ARRAY['Income'::"text", 'Expense'::"text", 'Both'::"text"])))
);


ALTER TABLE "public"."treasury_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."treasury_categories" IS 'Categories for organizing treasury transactions';



CREATE TABLE IF NOT EXISTS "public"."treasury_history" (
    "id" integer NOT NULL,
    "settlement_id" "text" NOT NULL,
    "balance" bigint NOT NULL,
    "previous_balance" bigint DEFAULT 0,
    "change_amount" bigint DEFAULT 0,
    "supplies" integer,
    "tier" integer,
    "num_tiles" integer,
    "data_source" "text" DEFAULT 'bitjita_polling'::"text",
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treasury_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."treasury_history" IS 'Historical treasury balance snapshots collected by polling service for charting and analytics';



COMMENT ON COLUMN "public"."treasury_history"."settlement_id" IS 'Settlement ID from BitJita (matches settlements_master.id)';



COMMENT ON COLUMN "public"."treasury_history"."balance" IS 'Treasury balance at time of snapshot';



COMMENT ON COLUMN "public"."treasury_history"."change_amount" IS 'Change from previous balance (positive = income, negative = expense)';



COMMENT ON COLUMN "public"."treasury_history"."data_source" IS 'Source of this snapshot (bitjita_polling, manual, etc.)';



CREATE SEQUENCE IF NOT EXISTS "public"."treasury_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."treasury_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."treasury_history_id_seq" OWNED BY "public"."treasury_history"."id";



CREATE TABLE IF NOT EXISTS "public"."treasury_monthly_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    "opening_balance" numeric(15,2) DEFAULT 0 NOT NULL,
    "closing_balance" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_income" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_expenses" numeric(15,2) DEFAULT 0 NOT NULL,
    "net_change" numeric(15,2) DEFAULT 0 NOT NULL,
    "transaction_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "treasury_monthly_summary_month_check" CHECK ((("month" >= 1) AND ("month" <= 12)))
);


ALTER TABLE "public"."treasury_monthly_summary" OWNER TO "postgres";


COMMENT ON TABLE "public"."treasury_monthly_summary" IS 'Monthly aggregated treasury statistics';



CREATE TABLE IF NOT EXISTS "public"."treasury_subcategories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treasury_subcategories" OWNER TO "postgres";


COMMENT ON TABLE "public"."treasury_subcategories" IS 'Subcategories for detailed transaction classification';



CREATE TABLE IF NOT EXISTS "public"."treasury_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "current_balance" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_income" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_expenses" numeric(15,2) DEFAULT 0 NOT NULL,
    "last_transaction_date" "date",
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treasury_summary" OWNER TO "postgres";


COMMENT ON TABLE "public"."treasury_summary" IS 'Current treasury state and summary statistics';



CREATE TABLE IF NOT EXISTS "public"."treasury_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "category" "text",
    "subcategory" "text",
    "description" "text" NOT NULL,
    "related_project_id" "uuid",
    "related_member_id" "uuid",
    "source" "text",
    "is_recurring" boolean DEFAULT false,
    "recurring_frequency" "text",
    "transaction_date" "date" DEFAULT CURRENT_DATE,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "settlement_id" "text",
    CONSTRAINT "treasury_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['Income'::"text", 'Expense'::"text", 'Transfer'::"text", 'Adjustment'::"text"])))
);


ALTER TABLE "public"."treasury_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."treasury_transactions" IS 'Settlement treasury transaction records - all financial activity tied to authenticated settlement members';



COMMENT ON COLUMN "public"."treasury_transactions"."related_member_id" IS 'Links transaction to authenticated settlement member who made it';



CREATE TABLE IF NOT EXISTS "public"."user_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "activity_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_calculator_saves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "recipe_data" "jsonb" NOT NULL,
    "item_slug" "text" NOT NULL,
    "quantity" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_calculator_saves" OWNER TO "postgres";


ALTER TABLE ONLY "public"."settlement_projects" ALTER COLUMN "project_number" SET DEFAULT "nextval"('"public"."settlement_projects_project_number_seq"'::"regclass");



ALTER TABLE ONLY "public"."treasury_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."treasury_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."member_contributions"
    ADD CONSTRAINT "member_contributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_items"
    ADD CONSTRAINT "project_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_member_id_key" UNIQUE ("project_id", "member_id");



ALTER TABLE ONLY "public"."settlement_members_memberships"
    ADD CONSTRAINT "settlement_members_memberships_pkey" PRIMARY KEY ("player_entity_id", "settlement_id");



ALTER TABLE ONLY "public"."settlement_members"
    ADD CONSTRAINT "settlement_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settlement_members"
    ADD CONSTRAINT "settlement_members_player_entity_id_key" UNIQUE ("player_entity_id");



ALTER TABLE ONLY "public"."settlement_members"
    ADD CONSTRAINT "settlement_members_supabase_user_id_key" UNIQUE ("supabase_user_id");



ALTER TABLE ONLY "public"."settlement_projects"
    ADD CONSTRAINT "settlement_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settlement_projects"
    ADD CONSTRAINT "settlement_projects_short_id_key" UNIQUE ("short_id");



ALTER TABLE ONLY "public"."settlements_master"
    ADD CONSTRAINT "settlements_master_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_names"
    ADD CONSTRAINT "skill_names_pkey" PRIMARY KEY ("skill_id");



ALTER TABLE ONLY "public"."treasury_balance_history"
    ADD CONSTRAINT "treasury_balance_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treasury_categories"
    ADD CONSTRAINT "treasury_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."treasury_categories"
    ADD CONSTRAINT "treasury_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treasury_history"
    ADD CONSTRAINT "treasury_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treasury_monthly_summary"
    ADD CONSTRAINT "treasury_monthly_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treasury_monthly_summary"
    ADD CONSTRAINT "treasury_monthly_summary_year_month_key" UNIQUE ("year", "month");



ALTER TABLE ONLY "public"."treasury_subcategories"
    ADD CONSTRAINT "treasury_subcategories_category_id_name_key" UNIQUE ("category_id", "name");



ALTER TABLE ONLY "public"."treasury_subcategories"
    ADD CONSTRAINT "treasury_subcategories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treasury_summary"
    ADD CONSTRAINT "treasury_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treasury_transactions"
    ADD CONSTRAINT "treasury_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_calculator_saves"
    ADD CONSTRAINT "user_calculator_saves_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_member_contributions_delivery_method" ON "public"."member_contributions" USING "btree" ("delivery_method");



CREATE INDEX "idx_member_contributions_member_id" ON "public"."member_contributions" USING "btree" ("member_id");



CREATE INDEX "idx_member_contributions_project_id" ON "public"."member_contributions" USING "btree" ("project_id");



CREATE INDEX "idx_project_items_project_id" ON "public"."project_items" USING "btree" ("project_id");



CREATE INDEX "idx_project_members_member_id" ON "public"."project_members" USING "btree" ("member_id");



CREATE INDEX "idx_project_members_project_id" ON "public"."project_members" USING "btree" ("project_id");



CREATE INDEX "idx_settlement_members_active" ON "public"."settlement_members" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_settlement_members_avatar_url" ON "public"."settlement_members" USING "btree" ("avatar_url") WHERE ("avatar_url" IS NOT NULL);



CREATE INDEX "idx_settlement_members_last_login" ON "public"."settlement_members" USING "btree" ("last_login_timestamp" DESC);



CREATE INDEX "idx_settlement_members_player_entity_id" ON "public"."settlement_members" USING "btree" ("player_entity_id");



CREATE INDEX "idx_settlement_members_primary_profession" ON "public"."settlement_members" USING "btree" ("primary_profession");



CREATE INDEX "idx_settlement_members_secondary_profession" ON "public"."settlement_members" USING "btree" ("secondary_profession");



CREATE INDEX "idx_settlement_members_supabase_user_id" ON "public"."settlement_members" USING "btree" ("supabase_user_id");



CREATE INDEX "idx_settlement_members_top_profession" ON "public"."settlement_members" USING "btree" ("top_profession");



CREATE UNIQUE INDEX "idx_settlement_projects_number" ON "public"."settlement_projects" USING "btree" ("project_number");



CREATE INDEX "idx_settlement_projects_project_number_lookup" ON "public"."settlement_projects" USING "btree" ("project_number");



CREATE INDEX "idx_settlement_projects_settlement_id" ON "public"."settlement_projects" USING "btree" ("settlement_id");



CREATE INDEX "idx_settlement_projects_short_id" ON "public"."settlement_projects" USING "btree" ("short_id");



CREATE INDEX "idx_settlements_master_active" ON "public"."settlements_master" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_settlements_master_last_synced" ON "public"."settlements_master" USING "btree" ("last_synced_at");



CREATE INDEX "idx_settlements_master_location" ON "public"."settlements_master" USING "btree" ("location_x", "location_z");



CREATE INDEX "idx_settlements_master_name" ON "public"."settlements_master" USING "btree" ("name");



CREATE INDEX "idx_settlements_master_neutral" ON "public"."settlements_master" USING "btree" ("neutral");



CREATE INDEX "idx_settlements_master_owner" ON "public"."settlements_master" USING "btree" ("owner_player_entity_id");



CREATE INDEX "idx_settlements_master_region_id" ON "public"."settlements_master" USING "btree" ("region_id");



CREATE INDEX "idx_settlements_master_region_name" ON "public"."settlements_master" USING "btree" ("region_name");



CREATE INDEX "idx_settlements_master_researching" ON "public"."settlements_master" USING "btree" ("researching") WHERE ("researching" > 0);



CREATE INDEX "idx_settlements_master_tier" ON "public"."settlements_master" USING "btree" ("tier");



CREATE INDEX "idx_settlements_master_treasury" ON "public"."settlements_master" USING "btree" ("treasury" DESC);



CREATE INDEX "idx_skill_names_skill_name" ON "public"."skill_names" USING "btree" ("skill_name");



CREATE INDEX "idx_treasury_balance_history_change_type" ON "public"."treasury_balance_history" USING "btree" ("change_type");



CREATE INDEX "idx_treasury_balance_history_recorded_at" ON "public"."treasury_balance_history" USING "btree" ("recorded_at");



CREATE INDEX "idx_treasury_categories_active" ON "public"."treasury_categories" USING "btree" ("is_active");



CREATE INDEX "idx_treasury_categories_type" ON "public"."treasury_categories" USING "btree" ("type");



CREATE INDEX "idx_treasury_history_recorded_at" ON "public"."treasury_history" USING "btree" ("recorded_at");



CREATE INDEX "idx_treasury_history_settlement_id" ON "public"."treasury_history" USING "btree" ("settlement_id");



CREATE INDEX "idx_treasury_history_settlement_time" ON "public"."treasury_history" USING "btree" ("settlement_id", "recorded_at" DESC);



CREATE INDEX "idx_treasury_monthly_summary_year_month" ON "public"."treasury_monthly_summary" USING "btree" ("year", "month");



CREATE INDEX "idx_treasury_subcategories_category_id" ON "public"."treasury_subcategories" USING "btree" ("category_id");



CREATE INDEX "idx_treasury_transactions_category" ON "public"."treasury_transactions" USING "btree" ("category");



CREATE INDEX "idx_treasury_transactions_related_project" ON "public"."treasury_transactions" USING "btree" ("related_project_id");



CREATE INDEX "idx_treasury_transactions_transaction_date" ON "public"."treasury_transactions" USING "btree" ("transaction_date");



CREATE INDEX "idx_treasury_transactions_type" ON "public"."treasury_transactions" USING "btree" ("transaction_type");



CREATE INDEX "idx_user_activity_created_at" ON "public"."user_activity" USING "btree" ("created_at");



CREATE INDEX "idx_user_activity_member_id" ON "public"."user_activity" USING "btree" ("member_id");



CREATE INDEX "idx_user_calculator_saves_member_id" ON "public"."user_calculator_saves" USING "btree" ("member_id");



CREATE OR REPLACE TRIGGER "trigger_auto_generate_project_short_id" BEFORE INSERT ON "public"."settlement_projects" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_project_short_id"();



CREATE OR REPLACE TRIGGER "trigger_update_member_skills_aggregation" BEFORE INSERT OR UPDATE ON "public"."settlement_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_member_skills_aggregation"();



CREATE OR REPLACE TRIGGER "update_project_items_updated_at" BEFORE UPDATE ON "public"."project_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_settlement_projects_updated_at" BEFORE UPDATE ON "public"."settlement_projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_skill_names_updated_at" BEFORE UPDATE ON "public"."skill_names" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_calculator_saves_updated_at" BEFORE UPDATE ON "public"."user_calculator_saves" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."settlement_projects"
    ADD CONSTRAINT "fk_settlement_projects_settlement_id" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements_master"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_contributions"
    ADD CONSTRAINT "member_contributions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."settlement_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_contributions"
    ADD CONSTRAINT "member_contributions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."settlement_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_items"
    ADD CONSTRAINT "project_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."settlement_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."settlement_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."settlement_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settlement_members_memberships"
    ADD CONSTRAINT "settlement_members_memberships_player_entity_id_fkey" FOREIGN KEY ("player_entity_id") REFERENCES "public"."settlement_members"("player_entity_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settlement_members_memberships"
    ADD CONSTRAINT "settlement_members_memberships_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements_master"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settlement_projects"
    ADD CONSTRAINT "settlement_projects_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."settlement_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treasury_subcategories"
    ADD CONSTRAINT "treasury_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."treasury_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treasury_transactions"
    ADD CONSTRAINT "treasury_transactions_related_member_id_fkey" FOREIGN KEY ("related_member_id") REFERENCES "public"."settlement_members"("id");



ALTER TABLE ONLY "public"."treasury_transactions"
    ADD CONSTRAINT "treasury_transactions_related_project_id_fkey" FOREIGN KEY ("related_project_id") REFERENCES "public"."settlement_projects"("id");



ALTER TABLE ONLY "public"."treasury_transactions"
    ADD CONSTRAINT "treasury_transactions_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements_master"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."settlement_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_calculator_saves"
    ADD CONSTRAINT "user_calculator_saves_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."settlement_members"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to read treasury history" ON "public"."treasury_history" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow service accounts to manage treasury history" ON "public"."treasury_history" TO "service_role" USING (true);



CREATE POLICY "Project members can manage project items" ON "public"."project_items" USING (("project_id" IN ( SELECT "pm"."project_id"
   FROM ("public"."project_members" "pm"
     JOIN "public"."settlement_members" "sm" ON (("pm"."member_id" = "sm"."id")))
  WHERE ("sm"."supabase_user_id" = ("auth"."uid"())::"text"))));



CREATE POLICY "Settlement members can add treasury transactions" ON "public"."treasury_transactions" FOR INSERT WITH CHECK ((("related_member_id" IN ( SELECT "settlement_members"."id"
   FROM "public"."settlement_members"
  WHERE ("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text"))) OR ("related_member_id" IS NULL)));



CREATE POLICY "Settlement members can view project items" ON "public"."project_items" FOR SELECT USING (("project_id" IN ( SELECT "settlement_projects"."id"
   FROM "public"."settlement_projects"
  WHERE (EXISTS ( SELECT 1
           FROM "public"."settlement_members"
          WHERE ("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text"))))));



CREATE POLICY "Settlement members can view project members" ON "public"."project_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."settlement_members"
  WHERE ("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text"))));



CREATE POLICY "Settlement members can view treasury transactions" ON "public"."treasury_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."settlement_members"
  WHERE ("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text"))));



CREATE POLICY "Users can access their own activity" ON "public"."user_activity" USING (("member_id" IN ( SELECT "settlement_members"."id"
   FROM "public"."settlement_members"
  WHERE ("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text"))));



CREATE POLICY "Users can access their own calculator saves" ON "public"."user_calculator_saves" USING (("member_id" IN ( SELECT "settlement_members"."id"
   FROM "public"."settlement_members"
  WHERE ("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text"))));



CREATE POLICY "Users can add their own contributions" ON "public"."member_contributions" FOR INSERT WITH CHECK (("member_id" IN ( SELECT "settlement_members"."id"
   FROM "public"."settlement_members"
  WHERE ("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text"))));



CREATE POLICY "Users can update their own treasury transactions" ON "public"."treasury_transactions" FOR UPDATE USING (("related_member_id" IN ( SELECT "settlement_members"."id"
   FROM "public"."settlement_members"
  WHERE ("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text"))));



CREATE POLICY "Users can view all contributions" ON "public"."member_contributions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."settlement_members"
  WHERE ("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text"))));



ALTER TABLE "public"."member_contributions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "settlement_members_delete" ON "public"."settlement_members" FOR DELETE USING (false);



COMMENT ON POLICY "settlement_members_delete" ON "public"."settlement_members" IS 'Restrict deletion to system operations only (currently disabled)';



CREATE POLICY "settlement_members_insert" ON "public"."settlement_members" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



COMMENT ON POLICY "settlement_members_insert" ON "public"."settlement_members" IS 'Allow authenticated users to create settlement member data during establishment';



CREATE POLICY "settlement_members_select" ON "public"."settlement_members" FOR SELECT USING (true);



COMMENT ON POLICY "settlement_members_select" ON "public"."settlement_members" IS 'Allow reading settlement member data for search, roster viewing, and API operations';



CREATE POLICY "settlement_members_update" ON "public"."settlement_members" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ((("supabase_user_id" IS NULL) AND (("auth"."uid"())::"text" IS NOT NULL)) OR ("supabase_user_id" = ("auth"."uid"())::"text"))));



COMMENT ON POLICY "settlement_members_update" ON "public"."settlement_members" IS 'Allow character claiming and personal data updates for own characters';



ALTER TABLE "public"."settlement_projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treasury_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treasury_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_activity_all" ON "public"."user_activity" USING (("member_id" IN ( SELECT "settlement_members"."id"
   FROM "public"."settlement_members"
  WHERE (("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text") AND ("settlement_members"."is_active" = true)))));



ALTER TABLE "public"."user_calculator_saves" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_calculator_saves_all" ON "public"."user_calculator_saves" USING (("member_id" IN ( SELECT "settlement_members"."id"
   FROM "public"."settlement_members"
  WHERE (("settlement_members"."supabase_user_id" = ("auth"."uid"())::"text") AND ("settlement_members"."is_active" = true)))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";












GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."auto_generate_project_short_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_project_short_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_project_short_id"() TO "service_role";



GRANT ALL ON TABLE "public"."settlement_members" TO "anon";
GRANT ALL ON TABLE "public"."settlement_members" TO "authenticated";
GRANT ALL ON TABLE "public"."settlement_members" TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_bitjita_user_id" "text", "p_member_id" "uuid", "p_display_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_bitjita_user_id" "text", "p_member_id" "uuid", "p_display_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_bitjita_user_id" "text", "p_member_id" "uuid", "p_display_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_member_id" "uuid", "p_bitjita_user_id" "text", "p_display_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_member_id" "uuid", "p_bitjita_user_id" "text", "p_display_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_character"("p_supabase_user_id" "text", "p_member_id" "uuid", "p_bitjita_user_id" "text", "p_display_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_treasury_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_treasury_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_treasury_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_auth_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_auth_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_auth_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_settlement_invite_code"("p_settlement_id" "text", "p_generated_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_settlement_invite_code"("p_settlement_id" "text", "p_generated_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_settlement_invite_code"("p_settlement_id" "text", "p_generated_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_all_settlements_have_invite_codes"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_all_settlements_have_invite_codes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_all_settlements_have_invite_codes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_bulk_invite_codes"("p_batch_size" integer, "p_generated_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_bulk_invite_codes"("p_batch_size" integer, "p_generated_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_bulk_invite_codes"("p_batch_size" integer, "p_generated_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invite_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invite_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invite_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_project_short_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_project_short_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_project_short_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_invite_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_invite_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_invite_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_activity_status"("last_login_timestamp" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_activity_status"("last_login_timestamp" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_activity_status"("last_login_timestamp" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_settlement_id"("user_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_settlement_id"("user_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_settlement_id"("user_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_settlement_permissions"("settlement_id_param" "text", "user_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_settlement_permissions"("settlement_id_param" "text", "user_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_settlement_permissions"("settlement_id_param" "text", "user_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_settlement_management_permission"("settlement_id_param" "text", "user_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_settlement_management_permission"("settlement_id_param" "text", "user_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_settlement_management_permission"("settlement_id_param" "text", "user_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_recently_active"("last_login_timestamp" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."is_recently_active"("last_login_timestamp" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_recently_active"("last_login_timestamp" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_settlement_member"("settlement_id_param" "text", "user_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_settlement_member"("settlement_id_param" "text", "user_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_settlement_member"("settlement_id_param" "text", "user_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_settlement_member_of"("settlement_id_param" "text", "user_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_settlement_member_of"("settlement_id_param" "text", "user_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_settlement_member_of"("settlement_id_param" "text", "user_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regenerate_settlement_invite_code"("p_settlement_id" "text", "p_regenerated_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regenerate_settlement_invite_code"("p_settlement_id" "text", "p_regenerated_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regenerate_settlement_invite_code"("p_settlement_id" "text", "p_regenerated_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_member_skills_aggregation"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_member_skills_aggregation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_member_skills_aggregation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."member_contributions" TO "anon";
GRANT ALL ON TABLE "public"."member_contributions" TO "authenticated";
GRANT ALL ON TABLE "public"."member_contributions" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_analytics" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."project_items" TO "anon";
GRANT ALL ON TABLE "public"."project_items" TO "authenticated";
GRANT ALL ON TABLE "public"."project_items" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."settlement_members_memberships" TO "anon";
GRANT ALL ON TABLE "public"."settlement_members_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."settlement_members_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."settlement_projects" TO "anon";
GRANT ALL ON TABLE "public"."settlement_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."settlement_projects" TO "service_role";



GRANT ALL ON SEQUENCE "public"."settlement_projects_project_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."settlement_projects_project_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."settlement_projects_project_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."settlements_master" TO "anon";
GRANT ALL ON TABLE "public"."settlements_master" TO "authenticated";
GRANT ALL ON TABLE "public"."settlements_master" TO "service_role";



GRANT ALL ON TABLE "public"."skill_names" TO "anon";
GRANT ALL ON TABLE "public"."skill_names" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_names" TO "service_role";



GRANT ALL ON TABLE "public"."treasury_balance_history" TO "anon";
GRANT ALL ON TABLE "public"."treasury_balance_history" TO "authenticated";
GRANT ALL ON TABLE "public"."treasury_balance_history" TO "service_role";



GRANT ALL ON TABLE "public"."treasury_categories" TO "anon";
GRANT ALL ON TABLE "public"."treasury_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."treasury_categories" TO "service_role";



GRANT ALL ON TABLE "public"."treasury_history" TO "anon";
GRANT ALL ON TABLE "public"."treasury_history" TO "authenticated";
GRANT ALL ON TABLE "public"."treasury_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."treasury_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."treasury_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."treasury_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."treasury_monthly_summary" TO "anon";
GRANT ALL ON TABLE "public"."treasury_monthly_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."treasury_monthly_summary" TO "service_role";



GRANT ALL ON TABLE "public"."treasury_subcategories" TO "anon";
GRANT ALL ON TABLE "public"."treasury_subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."treasury_subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."treasury_summary" TO "anon";
GRANT ALL ON TABLE "public"."treasury_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."treasury_summary" TO "service_role";



GRANT ALL ON TABLE "public"."treasury_transactions" TO "anon";
GRANT ALL ON TABLE "public"."treasury_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."treasury_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity" TO "anon";
GRANT ALL ON TABLE "public"."user_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity" TO "service_role";



GRANT ALL ON TABLE "public"."user_calculator_saves" TO "anon";
GRANT ALL ON TABLE "public"."user_calculator_saves" TO "authenticated";
GRANT ALL ON TABLE "public"."user_calculator_saves" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
