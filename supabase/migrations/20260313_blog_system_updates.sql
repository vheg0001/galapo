ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS read_time INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts (is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON blog_posts (is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts (published_at DESC);