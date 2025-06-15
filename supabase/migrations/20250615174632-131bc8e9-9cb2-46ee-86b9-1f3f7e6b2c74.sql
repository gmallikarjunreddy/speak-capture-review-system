
-- Create a public bucket for recordings if it doesn't exist
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', true)
on conflict (id) do nothing;

-- Set up RLS policies for the recordings bucket to allow public read access
-- First, drop existing policy to avoid conflict
DROP POLICY IF EXISTS "Public read for recordings" ON storage.objects;
CREATE POLICY "Public read for recordings" ON storage.objects
  FOR SELECT USING (bucket_id = 'recordings');

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload recordings" ON storage.objects;
CREATE POLICY "Authenticated users can upload recordings" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'recordings' AND auth.role() = 'authenticated');
