-- Migration 16: Counter-offer fields on bids
-- Lets the buyer counter a seller's bid (and vice versa). Writes happen via
-- server routes that use the service role, so no extra RLS policies are needed.

BEGIN;

ALTER TABLE public.bids
  ADD COLUMN IF NOT EXISTS counter_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS counter_message TEXT,
  ADD COLUMN IF NOT EXISTS counter_by TEXT CHECK (counter_by IN ('buyer', 'seller')),
  ADD COLUMN IF NOT EXISTS counter_at TIMESTAMPTZ;

SELECT
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bids' AND column_name='counter_price') AS has_counter_price,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bids' AND column_name='counter_by')    AS has_counter_by;

COMMIT;
