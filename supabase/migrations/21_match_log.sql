-- Migration 21: inventory match log
-- Records every buyer-request → seller-inventory match the matching engine
-- makes, so admins can see who was told about what (and spot requests that
-- matched nobody). Written server-side only, via the service role.

BEGIN;

CREATE TABLE IF NOT EXISTS public.inventory_match_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  seller_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  inventory_id  UUID REFERENCES public.seller_inventory(id) ON DELETE SET NULL,
  score         NUMERIC(4, 3),
  -- 'matched'   = a seller was notified about this request
  -- 'no_match'  = the request ran through the engine and hit nothing (one row
  --               per request, seller_id NULL). This is the signal worth
  --               watching early on: demand with no supply behind it.
  outcome       TEXT NOT NULL DEFAULT 'matched',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_match_log_created_at_idx
  ON public.inventory_match_log(created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_match_log_request_id_idx
  ON public.inventory_match_log(request_id);
CREATE INDEX IF NOT EXISTS inventory_match_log_seller_id_idx
  ON public.inventory_match_log(seller_id);

-- RLS on with no policies: no client (anon or authenticated) can read or write.
-- The admin pages read this through the service-role client, which bypasses RLS.
ALTER TABLE public.inventory_match_log ENABLE ROW LEVEL SECURITY;

-- Sanity check ---------------------------------------------------------------
SELECT
  EXISTS(SELECT 1 FROM information_schema.tables
         WHERE table_schema='public' AND table_name='inventory_match_log') AS has_match_log;

COMMIT;
