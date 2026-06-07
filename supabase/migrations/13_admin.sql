-- Migration 13: Admin + moderation
-- Adds is_admin / banned_at to profiles, plus a guard trigger so authenticated
-- users cannot mutate either column directly (only the service_role can).

BEGIN;

-- 1. Columns -----------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin  BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- 2. Guard trigger -----------------------------------------------------------
-- Without this, the RLS policy "Users can update own profile" would let any
-- signed-in user set is_admin=true on their own row.
CREATE OR REPLACE FUNCTION public.guard_profile_admin_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Block only the PostgREST API roles used by end users. The SQL editor
  -- (current_user = postgres) and the admin client (service_role) are allowed
  -- to change these columns.
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'Only administrators can change is_admin.';
    END IF;
    IF NEW.banned_at IS DISTINCT FROM OLD.banned_at THEN
      RAISE EXCEPTION 'Only administrators can change banned_at.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_admin_columns ON public.profiles;
CREATE TRIGGER profiles_guard_admin_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_admin_columns();

-- 3. Bootstrap your own admin row --------------------------------------------
-- IMPORTANT: this only works if a profile row exists for that email. If it
-- doesn't fire, sign in once first and then re-run this UPDATE.
UPDATE public.profiles
SET is_admin = true
WHERE id IN (SELECT id FROM auth.users WHERE email = 'ttyuiopaeft.oppo@gmail.com');

-- 4. Sanity check ------------------------------------------------------------
SELECT
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_admin') AS has_is_admin,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='banned_at') AS has_banned_at,
  (SELECT count(*) FROM public.profiles WHERE is_admin = true) AS admin_count;

COMMIT;
