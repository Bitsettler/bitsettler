# Cursor Rules for Supabase

1. Do NOT create or alter database schema via runtime scripts or `supabase-js`.
2. All schema changes MUST use Supabase CLI:
   - supabase migration new <name>
   - Edit SQL in /supabase/migrations
   - supabase db push
3. Commit migration files. Never bypass this workflow.
