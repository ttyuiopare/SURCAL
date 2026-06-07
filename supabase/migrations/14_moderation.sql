-- Migration 14: AI content moderation queue
-- Stores AI-flagged content for admin review. Written only by the service_role
-- (admin client); RLS is enabled with no client policies so end users can't
-- read or write it. The admin UI reads it server-side via the admin client.

BEGIN;

CREATE TABLE IF NOT EXISTS public.moderation_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type    TEXT NOT NULL,                 -- 'request' | 'bid' | 'message'
  content_id      UUID,                           -- id of the offending row (nullable for safety)
  flagged_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category        TEXT,                           -- e.g. 'fraud', 'prohibited_item', 'harassment', 'spam'
  severity        TEXT NOT NULL DEFAULT 'low',     -- 'low' | 'medium' | 'high'
  reason          TEXT,                           -- one-line AI explanation
  excerpt         TEXT,                           -- snippet of the flagged content
  link            TEXT,                           -- where an admin can view it
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'actioned' | 'dismissed'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS moderation_flags_status_created_idx
  ON public.moderation_flags(status, created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_flags_user_idx
  ON public.moderation_flags(flagged_user_id);

-- RLS on, no policies → only the service_role (admin client) can touch it.
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

SELECT
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='moderation_flags') AS has_moderation_flags;

COMMIT;
