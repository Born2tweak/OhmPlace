-- =============================================
-- OhmPlace Community Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    campus TEXT NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) <= 200),
    body TEXT CHECK (char_length(body) <= 5000),
    flair TEXT,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post votes table
CREATE TABLE IF NOT EXISTS post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    body TEXT NOT NULL CHECK (char_length(body) <= 2000),
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comment votes table
CREATE TABLE IF NOT EXISTS comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_posts_campus ON posts(campus);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);

-- Disable RLS (service role key bypasses it anyway)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes DISABLE ROW LEVEL SECURITY;
