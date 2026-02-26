-- Migration: Add parent_id to comments for nested replies
-- Run this in the Supabase SQL Editor

ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Index for efficient nested comment queries
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
