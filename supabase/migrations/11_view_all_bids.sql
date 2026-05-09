-- Supabase migration to allow everyone to view all bids on requests
DROP POLICY IF EXISTS "Sellers can view their own bids" ON public.bids;
DROP POLICY IF EXISTS "Buyers can view bids on their requests" ON public.bids;
DROP POLICY IF EXISTS "Anyone can view all bids" ON public.bids;

CREATE POLICY "Anyone can view all bids"
  ON public.bids FOR SELECT
  USING (true);
