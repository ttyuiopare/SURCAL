-- Photo attachments in the inbox.
-- Safe to run multiple times.

-- 1. Column the message photo URL is stored on (07 added this, but re-assert
--    with IF NOT EXISTS in case that migration was never applied here).
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Public storage bucket the client uploads message photos to.
INSERT INTO storage.buckets (id, name, public)
VALUES ('request_images', 'request_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage policies: signed-in users can upload; anyone can view.
DROP POLICY IF EXISTS "auth upload request_images" ON storage.objects;
CREATE POLICY "auth upload request_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'request_images');

DROP POLICY IF EXISTS "public read request_images" ON storage.objects;
CREATE POLICY "public read request_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'request_images');
