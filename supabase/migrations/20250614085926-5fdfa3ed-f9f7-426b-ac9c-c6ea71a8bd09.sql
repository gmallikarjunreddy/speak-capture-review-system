
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table (extends auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  state TEXT,
  mother_tongue TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sentences table for admin to manage
CREATE TABLE public.sentences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create recordings table to store audio data
CREATE TABLE public.recordings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sentence_id UUID REFERENCES public.sentences(id),
  audio_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('accepted', 'rejected')) DEFAULT 'accepted',
  attempt_number INTEGER DEFAULT 1,
  duration_seconds DECIMAL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recording sessions table to group recordings
CREATE TABLE public.recording_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sentences INTEGER DEFAULT 0,
  completed_sentences INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'paused')) DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recording_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for sentences (public read, admin write)
CREATE POLICY "Anyone can view active sentences" ON public.sentences
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can insert sentences" ON public.sentences
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own sentences" ON public.sentences
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for recordings
CREATE POLICY "Users can view own recordings" ON public.recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings" ON public.recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings" ON public.recordings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for recording_sessions
CREATE POLICY "Users can view own sessions" ON public.recording_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.recording_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.recording_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert some sample sentences
INSERT INTO public.sentences (text, category) VALUES
  ('The quick brown fox jumps over the lazy dog.', 'general'),
  ('Hello, my name is John and I am from California.', 'introduction'),
  ('Please read this sentence clearly and naturally.', 'instruction'),
  ('Technology has revolutionized the way we communicate.', 'technology'),
  ('The weather today is absolutely beautiful.', 'general'),
  ('I enjoy reading books in my free time.', 'personal'),
  ('Education is the key to success in life.', 'education'),
  ('Music brings joy to people around the world.', 'arts'),
  ('Healthy eating habits improve our quality of life.', 'health'),
  ('Traveling opens our minds to new experiences.', 'travel');
