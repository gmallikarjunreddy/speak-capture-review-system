
-- Create admin policies for viewing all data in admin panel

-- Allow anyone to view all user profiles (for admin panel)
CREATE POLICY "Allow admin access to all profiles" ON public.user_profiles
  FOR SELECT USING (true);

-- Allow anyone to view all sentences (for admin panel)
CREATE POLICY "Allow admin access to all sentences" ON public.sentences
  FOR SELECT USING (true);

-- Allow anyone to update and delete sentences (for admin panel)
CREATE POLICY "Allow admin access to modify sentences" ON public.sentences
  FOR UPDATE USING (true);

CREATE POLICY "Allow admin access to delete sentences" ON public.sentences
  FOR DELETE USING (true);

-- Allow anyone to view all recordings (for admin panel)
CREATE POLICY "Allow admin access to all recordings" ON public.recordings
  FOR SELECT USING (true);

-- Allow anyone to view all recording sessions (for admin panel)
CREATE POLICY "Allow admin access to all sessions" ON public.recording_sessions
  FOR SELECT USING (true);
