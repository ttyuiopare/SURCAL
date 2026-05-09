-- Add stripe_account_id and stripe_onboarding_complete to profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_account_id') THEN 
    ALTER TABLE public.profiles ADD COLUMN stripe_account_id TEXT;
  END IF; 
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_onboarding_complete') THEN 
    ALTER TABLE public.profiles ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT false;
  END IF; 
END $$;
