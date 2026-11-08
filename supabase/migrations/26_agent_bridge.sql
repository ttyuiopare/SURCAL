-- Remote agent bridge: messages typed on the /agent web page (phone-friendly)
-- are picked up by a small service on the owner's PC, which runs the OpenClaw
-- agent and writes the reply back. Only the account owner (is_admin) is served
-- by the bridge; RLS keeps every other user to their own (empty) rows.

CREATE TABLE IF NOT EXISTS public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent messages own select" ON public.agent_messages;
CREATE POLICY "agent messages own select"
  ON public.agent_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Clients may only ever append their own *user* messages; assistant replies
-- are written by the bridge using the service-role key (bypasses RLS).
DROP POLICY IF EXISTS "agent messages own insert" ON public.agent_messages;
CREATE POLICY "agent messages own insert"
  ON public.agent_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'user');
