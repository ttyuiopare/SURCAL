-- Auto-release escrow: track when an order shipped so funds can auto-release
-- after a confirmation window if the buyer never manually confirms delivery.
-- Safe to run multiple times.

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Give any already-shipped orders a fresh window starting now (so they don't
-- release the instant the cron first runs).
UPDATE public.transactions
SET shipped_at = NOW()
WHERE status = 'shipped' AND shipped_at IS NULL;
