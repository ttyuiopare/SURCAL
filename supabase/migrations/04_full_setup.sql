-- Setup UUID Extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Categories and Products
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

-- Delete any existing categories and Insert new product categories
DELETE FROM public.categories;
INSERT INTO public.categories (name) VALUES
  ('Electronics & Computers'),
  ('Sneakers & Streetwear'),
  ('Collectibles & Trading Cards'),
  ('Automotive Parts'),
  ('Home & Garden'),
  ('Jewelry & Watches');

-- Add category to requests (will ignore if it already exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='category_id') THEN 
    ALTER TABLE public.requests ADD COLUMN category_id UUID REFERENCES public.categories(id);
  END IF; 
END $$;

-- 2. Escrow Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES public.requests(id),
  bid_id UUID REFERENCES public.bids(id),
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'escrow',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  limits_requests INTEGER NOT NULL,
  limits_bids INTEGER NOT NULL
);

-- Delete and insert subscription plans
DELETE FROM public.subscription_plans;
INSERT INTO public.subscription_plans (name, price, limits_requests, limits_bids) VALUES 
('Free', 0, 100, 100),
('Pro', 9.99, -1, -1),
('Business', 29.99, -1, -1);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id),
  plan_id UUID REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMP WITH TIME ZONE
);

-- 4. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid default gen_random_uuid() primary key,
    request_id uuid references public.requests(id) on delete cascade not null,
    sender_id uuid references auth.users(id) not null,
    receiver_id uuid references auth.users(id) not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies For Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS For Subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (user_id = auth.uid());

-- RLS For Categories 
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are public" ON public.categories;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);

-- RLS For Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
CREATE POLICY "Users can read their own messages" ON public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages for insert with check (auth.uid() = sender_id);
