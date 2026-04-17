-- 1. Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    collection_name TEXT DEFAULT 'Saved Posts',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 2. User badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL, -- 'skillful', 'entertainer', 'professional', 'veteran', 'god'
    awarded_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- 3. Monthly leaderboard stats
CREATE TABLE IF NOT EXISTS monthly_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    posts_count INTEGER DEFAULT 0,
    likes_received INTEGER DEFAULT 0,
    comments_received INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    rank INTEGER,
    UNIQUE(user_id, month)
);

-- 4. User themes table
CREATE TABLE IF NOT EXISTS user_themes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_name TEXT NOT NULL,
    theme_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    share_code TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add badges column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES user_themes(id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_user_id ON monthly_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_month ON monthly_stats(month);

-- 7. Create function to update monthly stats
CREATE OR REPLACE FUNCTION update_monthly_stats()
RETURNS TRIGGER AS $$
DECLARE
    current_month DATE;
BEGIN
    current_month = DATE_TRUNC('month', NOW())::DATE;
    
    INSERT INTO monthly_stats (user_id, month, posts_count, likes_received, comments_received)
    VALUES (NEW.user_id, current_month, 1, 0, 0)
    ON CONFLICT (user_id, month) 
    DO UPDATE SET posts_count = monthly_stats.posts_count + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for post count
DROP TRIGGER IF EXISTS update_stats_on_post ON posts;
CREATE TRIGGER update_stats_on_post
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_stats();

-- 9. Function to award badges based on points
CREATE OR REPLACE FUNCTION award_badges()
RETURNS TRIGGER AS $$
BEGIN
    -- Skillful: 10+ posts
    IF NEW.posts_count >= 10 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_type = 'skillful') THEN
        INSERT INTO user_badges (user_id, badge_type) VALUES (NEW.user_id, 'skillful');
        UPDATE profiles SET badges = array_append(badges, 'skillful') WHERE id = NEW.user_id;
    END IF;
    
    -- Entertainer: 50+ likes received
    IF NEW.likes_received >= 50 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_type = 'entertainer') THEN
        INSERT INTO user_badges (user_id, badge_type) VALUES (NEW.user_id, 'entertainer');
        UPDATE profiles SET badges = array_append(badges, 'entertainer') WHERE id = NEW.user_id;
    END IF;
    
    -- Professional: 100+ posts
    IF NEW.posts_count >= 100 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_type = 'professional') THEN
        INSERT INTO user_badges (user_id, badge_type) VALUES (NEW.user_id, 'professional');
        UPDATE profiles SET badges = array_append(badges, 'professional') WHERE id = NEW.user_id;
    END IF;
    
    -- Veteran: Member for 30+ days
    IF (SELECT created_at FROM profiles WHERE id = NEW.user_id) <= NOW() - INTERVAL '30 days' 
       AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_type = 'veteran') THEN
        INSERT INTO user_badges (user_id, badge_type) VALUES (NEW.user_id, 'veteran');
        UPDATE profiles SET badges = array_append(badges, 'veteran') WHERE id = NEW.user_id;
    END IF;
    
    -- God: 500+ likes received
    IF NEW.likes_received >= 500 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_type = 'god') THEN
        INSERT INTO user_badges (user_id, badge_type) VALUES (NEW.user_id, 'god');
        UPDATE profiles SET badges = array_append(badges, 'god') WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to update like counts for stats
CREATE OR REPLACE FUNCTION update_like_stats()
RETURNS TRIGGER AS $$
DECLARE
    current_month DATE;
    post_owner UUID;
BEGIN
    current_month = DATE_TRUNC('month', NOW())::DATE;
    
    IF TG_OP = 'INSERT' THEN
        -- Get post owner
        SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
        
        INSERT INTO monthly_stats (user_id, month, posts_count, likes_received, comments_received)
        VALUES (post_owner, current_month, 0, 1, 0)
        ON CONFLICT (user_id, month) 
        DO UPDATE SET likes_received = monthly_stats.likes_received + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_on_like ON likes;
CREATE TRIGGER update_stats_on_like
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_like_stats();

-- 11. Enable RLS on new tables
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;

-- 12. Create policies
CREATE POLICY "Users can manage own bookmarks" ON bookmarks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view badges" ON user_badges
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view monthly stats" ON monthly_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own themes" ON user_themes
    FOR ALL USING (auth.uid() = user_id);

SELECT '✅ Enhanced features setup complete!' as status;
