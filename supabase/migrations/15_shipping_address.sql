-- Migration 15: Buyer shipping address on the transaction
-- Address is only stored on the transaction (already RLS-restricted to the
-- buyer + accepted seller), so losing bidders never see it.

BEGIN;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;

SELECT
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='shipping_address') AS has_shipping_address;

COMMIT;
