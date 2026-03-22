-- Migration to pivot categories from services to physical products
-- Wipes the old task/job based categories and inserts the new ones

DELETE FROM public.categories;

INSERT INTO public.categories (name) VALUES
  ('Electronics & Computers'),
  ('Sneakers & Streetwear'),
  ('Collectibles & Trading Cards'),
  ('Automotive Parts'),
  ('Home & Garden'),
  ('Jewelry & Watches');
