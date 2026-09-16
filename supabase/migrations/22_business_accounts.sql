-- Migration 22: Business accounts + public store pages
-- Business sellers get a public storefront at /store/<profile id> backed by
-- their seller_inventory. Individual sellers keep account_type = 'individual'.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type         TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS business_name        TEXT,
  ADD COLUMN IF NOT EXISTS business_description TEXT,
  ADD COLUMN IF NOT EXISTS business_category    TEXT,
  ADD COLUMN IF NOT EXISTS business_link        TEXT,
  ADD COLUMN IF NOT EXISTS onboarded_at         TIMESTAMPTZ;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('individual', 'business'));

COMMIT;
