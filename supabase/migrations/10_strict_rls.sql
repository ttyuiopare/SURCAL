-- Supabase Strict Row Level Security (RLS) Migration

-- Update Policies for Requests
DROP POLICY IF EXISTS "Requests are viewable by everyone." ON public.requests;
CREATE POLICY "Buyers can view their own requests"
  ON public.requests FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can view open requests or requests they bid on"
  ON public.requests FOR SELECT
  USING (
    status = 'open' 
    OR 
    id IN (SELECT request_id FROM public.bids WHERE seller_id = auth.uid())
  );

-- Update Policies for Bids
DROP POLICY IF EXISTS "Bids are viewable by everyone." ON public.bids;
CREATE POLICY "Sellers can view their own bids"
  ON public.bids FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Buyers can view bids on their requests"
  ON public.bids FOR SELECT
  USING (request_id IN (SELECT id FROM public.requests WHERE buyer_id = auth.uid()));

-- Transactions are already restricted to buyer_id or seller_id, but we ensure no active writes from clients
-- Subscriptions are already restricted to auth.uid()
