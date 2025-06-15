
-- Allow authenticated users to update their own files in the 'recordings' bucket.
-- This is necessary for the 'upsert' functionality to work correctly.
DROP POLICY IF EXISTS "Authenticated users can update their own recordings" ON storage.objects;
CREATE POLICY "Authenticated users can update their own recordings" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'recordings' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'recordings' AND auth.uid() = owner);
