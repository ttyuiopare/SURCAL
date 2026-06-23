-- Migration 18: Admin replies on support tickets
-- Records every reply sent from /admin/support so we have an audit trail
-- of what the user was told.

BEGIN;

CREATE TABLE IF NOT EXISTS public.support_ticket_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  admin_id    UUID REFERENCES auth.users(id),
  body        TEXT NOT NULL,
  email_id    TEXT, -- Resend message id, useful for debugging deliverability
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_ticket_replies_ticket_idx
  ON public.support_ticket_replies(ticket_id);

ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;
-- All writes and reads are done through the admin client; no end-user policies.

SELECT
  EXISTS(SELECT 1 FROM information_schema.tables
         WHERE table_schema='public' AND table_name='support_ticket_replies') AS has_table;

COMMIT;
