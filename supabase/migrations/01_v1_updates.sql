-- Migration 01: V1.0 Schema Updates
-- Adds Categories, Escrow Transactions, Subscriptions, and Waitlist

-- 1. Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

INSERT INTO public.categories (name) VALUES 
('Development'), ('Design'), ('Marketing'), ('Writing'), 
('Video & Audio'), ('Business'), ('Lifestyle'), ('Physical Products');

-- Add category to requests
ALTER TABLE public.requests ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- 2. Escrow Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES public.requests(id),
  bid_id UUID REFERENCES public.bids(id),
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'escrow', -- escrow, released, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Subscriptions
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  limits_requests INTEGER NOT NULL,
  limits_bids INTEGER NOT NULL -- -1 for unlimited
);

INSERT INTO public.subscription_plans (name, price, limits_requests, limits_bids) VALUES 
('Free', 0, 100, 100),
('Pro', 9.99, -1, -1),
('Business', 29.99, -1, -1);

CREATE TABLE public.user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id),
  plan_id UUID REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMP WITH TIME ZONE
);

-- 4. Pricing Waitlist
CREATE TABLE public.pricing_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  tier_interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies For Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS For Subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (user_id = auth.uid());

-- RLS For Categories (Publicly viewable)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);
