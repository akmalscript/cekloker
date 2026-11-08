-- Enable Row-Level Security on every table in the public schema.
--
-- Why: Supabase exposes the public schema through its REST API (PostgREST).
-- The anon key is public by design, so without RLS anyone with the project
-- URL can read, edit, and delete every row (Security Advisor:
-- rls_disabled_in_public, sensitive_columns_exposed).
--
-- Impact on the app: none. apps/web reaches the database through Prisma over a
-- direct Postgres connection as the `postgres` role, which owns the tables and
-- bypasses RLS. No policies are created on purpose, so the `anon` and
-- `authenticated` roles get zero access through the REST API. All access
-- control stays in apps/web (NextAuth + route handlers).
--
-- How to run: Supabase dashboard > SQL Editor > paste this file > Run.
-- It is idempotent and safe to run again after `prisma db push` adds tables.

-- 1. Turn on RLS for every existing table in public.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', t.schemaname, t.tablename);
  END LOOP;
END
$$;

-- 2. Defense in depth: remove direct table privileges from the API roles.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 3. Keep future tables created by `postgres` (e.g. via prisma db push) closed
--    to the API roles by default. RLS still has to be enabled by re-running step 1.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- 4. Verify: every row should show rls_enabled = true.
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
