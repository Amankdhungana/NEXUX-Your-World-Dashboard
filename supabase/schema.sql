-- ======================== COMPLETE SUPABASE SCHEMA FOR NEXUX DASHBOARD ========================

-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Remove all existing constraints and policies (clean slate)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;

ALTER TABLE posts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE posts ALTER COLUMN content DROP NOT NULL;

-- 3. Disable RLS temporarily to apply changes
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies
DROP POLICY IF EXISTS "posts_select_policy" ON posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON posts;
DROP POLICY IF EXISTS "posts_update_policy" ON posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON posts;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Auth users can insert posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- 5. Create new simple working policies
CREATE POLICY "posts_select_policy" ON posts 
    FOR SELECT USING (true);

CREATE POLICY "posts_insert_policy" ON posts 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "posts_update_policy" ON posts 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_policy" ON posts 
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "profiles_select_policy" ON profiles 
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "comments_select_policy" ON comments 
    FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON comments 
    FOR INSERT WITH CHECK (true);

-- 6. Re-enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 7. Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Drop existing storage policies
DROP POLICY IF EXISTS "Give authenticated users access to post-images" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to post-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- 9. Create storage policies
CREATE POLICY "Give authenticated users access to post-images"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'post-images')
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Give public access to post-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- 10. Create trigger function for auto-profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, email)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Create your profile manually (replace with your email if needed)
INSERT INTO profiles (id, username, email)
SELECT id, 'AmankD', email
FROM auth.users 
WHERE email = 'dhunganaaman7@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 13. Verify setup
SELECT '✅ Setup complete!' as status;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_posts FROM posts;
SELECT COUNT(*) as total_comments FROM comments;

-- 14. Show recent posts (for verification)
SELECT id, LEFT(content, 50) as preview, created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 5;
