
-- Create the database schema for local PostgreSQL
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  state TEXT,
  mother_tongue TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sentences table
CREATE TABLE public.sentences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id)
);

-- Create recordings table
CREATE TABLE public.recordings (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  sentence_id UUID REFERENCES public.sentences(id),
  audio_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('accepted', 'rejected')) DEFAULT 'accepted',
  attempt_number INTEGER DEFAULT 1,
  duration_seconds DECIMAL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recording_sessions table
CREATE TABLE public.recording_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  total_sentences INTEGER DEFAULT 0,
  completed_sentences INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'paused')) DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create admin_users table for admin authentication
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample sentences
INSERT INTO public.sentences (text) VALUES
  ('The quick brown fox jumps over the lazy dog.'),
  ('Hello, my name is John and I am from California.'),
  ('Please read this sentence clearly and naturally.'),
  ('Technology has revolutionized the way we communicate.'),
  ('The weather today is absolutely beautiful.'),
  ('I enjoy reading books in my free time.'),
  ('Education is the key to success in life.'),
  ('Music brings joy to people around the world.'),
  ('Healthy eating habits improve our quality of life.'),
  ('Traveling opens our minds to new experiences.');

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_recordings_user_id ON public.recordings(user_id);
CREATE INDEX idx_recordings_sentence_id ON public.recordings(sentence_id);
CREATE INDEX idx_recording_sessions_user_id ON public.recording_sessions(user_id);
CREATE INDEX idx_sentences_is_active ON public.sentences(is_active);

-- Insert default admin user (password: admin123)
-- You should change this password after setup
INSERT INTO public.admin_users (username, password_hash) VALUES 
('admin', '$2b$10$rOzE6QFtM9mMvz6w8w8w8eK8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8');
