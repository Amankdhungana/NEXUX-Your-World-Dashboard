-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 5),
  is_anonymous BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table (many-to-many)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Policies
-- Profiles: anyone can read, only owner can update
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profile update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: anyone can read, authenticated can insert, owner can update/delete
CREATE POLICY "Posts visible to all" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated insert posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner update posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comments: anyone can read, authenticated insert, owner update/delete
CREATE POLICY "Comments visible" ON comments FOR SELECT USING (true);
CREATE POLICY "Auth insert comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner update comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes: anyone can read, authenticated can insert/delete own
CREATE POLICY "Likes visible" ON likes FOR SELECT USING (true);
CREATE POLICY "Auth insert likes" ON likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner delete likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- Storage policy: authenticated users can upload
CREATE POLICY "Give users access to own folder" ON storage.objects
  FOR ALL USING (auth.role() = 'authenticated');
  