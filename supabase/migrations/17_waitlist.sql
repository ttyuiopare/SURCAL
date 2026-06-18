-- Migration 17: Pre-launch waitlist
-- Tracks emails of people who hit the login screen without an access code.

BEGIN;

CREATE TABLE IF NOT EXISTS public.waitlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Server routes use the admin client; no end-user reads needed.
DROP POLICY IF EXISTS "anyone can join waitlist" ON public.waitlist;
CREATE POLICY "anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

SELECT
  EXISTS(SELECT 1 FROM information_schema.tables
         WHERE table_schema='public' AND table_name='waitlist') AS has_waitlist;

COMMIT;
