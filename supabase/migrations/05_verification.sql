-- Migration 05: Seller Verification
-- Adds an is_verified boolean to profiles to verify authentic sellers.

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_verified') THEN 
    ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF; 
END $$;
