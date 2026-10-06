-- Migration 23: Account suspension + shipment-deadline auto-refund
-- 1. profiles.suspended_at — temporary suspension (distinct from banned_at,
--    which is the permanent "disabled" state). Suspended users are funneled
--    to /suspended by the proxy until an admin clears it.
-- 2. transactions.ship_reminder_sent_at — set once when the 24h "ship or
--    auto-refund" warning email goes out, so the daily cron never double-sends.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS ship_reminder_sent_at TIMESTAMPTZ;

COMMIT;
