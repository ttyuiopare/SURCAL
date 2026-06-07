-- Migration 12: Seller inventory + unified notifications + bid trigger
-- Adds the building blocks for the Smart Assistant matching engine and the
-- in-app notification feed.

BEGIN;

-- 1. seller_inventory --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_inventory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category_id   UUID REFERENCES public.categories(id),
  condition     TEXT,                          -- 'new', 'like_new', 'good', 'used', 'for_parts'
  asking_price  NUMERIC(10, 2),
  image_url     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_inventory_seller_id_idx ON public.seller_inventory(seller_id);
CREATE INDEX IF NOT EXISTS seller_inventory_category_id_idx ON public.seller_inventory(category_id);

ALTER TABLE public.seller_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory is viewable by everyone"           ON public.seller_inventory;
DROP POLICY IF EXISTS "Sellers can insert their own inventory"      ON public.seller_inventory;
DROP POLICY IF EXISTS "Sellers can update their own inventory"     ON public.seller_inventory;
DROP POLICY IF EXISTS "Sellers can delete their own inventory"      ON public.seller_inventory;

CREATE POLICY "Inventory is viewable by everyone"
  ON public.seller_inventory FOR SELECT USING (true);

CREATE POLICY "Sellers can insert their own inventory"
  ON public.seller_inventory FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own inventory"
  ON public.seller_inventory FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own inventory"
  ON public.seller_inventory FOR DELETE USING (auth.uid() = seller_id);

-- 2. notifications -----------------------------------------------------------
-- Idempotent so it works whether the table already exists or not.
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                  -- 'inventory_match', 'bid_received', 'bid_accepted', 'message', etc.
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,                           -- where clicking the notification should take the user
  metadata    JSONB DEFAULT '{}'::jsonb,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns that may be missing if the table existed under an older shape.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type     TEXT,
  ADD COLUMN IF NOT EXISTS title    TEXT,
  ADD COLUMN IF NOT EXISTS body     TEXT,
  ADD COLUMN IF NOT EXISTS link     TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_read  BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx
  ON public.notifications(user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications"   ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE USING (auth.uid() = user_id);
-- No client-side INSERT policy on purpose: notifications are only created
-- server-side via the service_role (admin client) or this trigger.

-- 3. Trigger: notify buyer on new bid ----------------------------------------
CREATE OR REPLACE FUNCTION public.notify_buyer_of_new_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_buyer_id     UUID;
  v_request_title TEXT;
BEGIN
  SELECT buyer_id, title INTO v_buyer_id, v_request_title
  FROM public.requests
  WHERE id = NEW.request_id;

  IF v_buyer_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    v_buyer_id,
    'bid_received',
    'New offer on "' || COALESCE(v_request_title, 'your request') || '"',
    'A seller offered $' || NEW.price::text || ' for your request.',
    '/requests/' || NEW.request_id::text,
    jsonb_build_object('request_id', NEW.request_id, 'bid_id', NEW.id, 'price', NEW.price)
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_buyer_of_new_bid() FROM anon, authenticated;

DROP TRIGGER IF EXISTS bids_notify_buyer ON public.bids;
CREATE TRIGGER bids_notify_buyer
  AFTER INSERT ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.notify_buyer_of_new_bid();

-- 4. Trigger: notify buyer when bid status changes to accepted/rejected ------
CREATE OR REPLACE FUNCTION public.notify_seller_of_bid_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_request_title TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('accepted', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_request_title FROM public.requests WHERE id = NEW.request_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    NEW.seller_id,
    'bid_' || NEW.status,
    CASE NEW.status
      WHEN 'accepted' THEN 'Your offer was accepted!'
      WHEN 'rejected' THEN 'Your offer was declined'
      ELSE 'Offer status updated'
    END,
    'Buyer ' || NEW.status || ' your $' || NEW.price::text || ' offer on "' || COALESCE(v_request_title, 'a request') || '".',
    '/requests/' || NEW.request_id::text,
    jsonb_build_object('request_id', NEW.request_id, 'bid_id', NEW.id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_seller_of_bid_status() FROM anon, authenticated;

DROP TRIGGER IF EXISTS bids_notify_seller_status ON public.bids;
CREATE TRIGGER bids_notify_seller_status
  AFTER UPDATE OF status ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.notify_seller_of_bid_status();

-- 5. updated_at touch trigger for seller_inventory ---------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_inventory_set_updated_at ON public.seller_inventory;
CREATE TRIGGER seller_inventory_set_updated_at
  BEFORE UPDATE ON public.seller_inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. push_subscriptions ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions"   ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- 7. Notification preferences on profiles ------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_email_bids     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email_matches  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_push_bids      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_push_matches   BOOLEAN NOT NULL DEFAULT true;

-- 8. Sanity check ------------------------------------------------------------
SELECT
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='seller_inventory')   AS has_seller_inventory,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications')      AS has_notifications,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='push_subscriptions') AS has_push_subscriptions,
  EXISTS(SELECT 1 FROM information_schema.triggers WHERE event_object_table='bids' AND trigger_name='bids_notify_buyer')          AS has_bid_insert_trigger,
  EXISTS(SELECT 1 FROM information_schema.triggers WHERE event_object_table='bids' AND trigger_name='bids_notify_seller_status') AS has_bid_status_trigger,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='notify_email_bids') AS has_email_pref,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='notify_push_bids')  AS has_push_pref;

COMMIT;
