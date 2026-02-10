-- Temporary fix: Disable RLS to allow Clerk-authenticated users to create listings
-- Run this in your Supabase SQL Editor

-- Disable RLS on both tables
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images DISABLE ROW LEVEL SECURITY;

-- Note: This means anyone with your Supabase anon key can read/write data
-- In production, you should implement one of these solutions:
-- 1. Use Clerk JWT with Supabase (requires configuration)
-- 2. Add service role key and bypass RLS in server-side code
-- 3. Switch to Supabase Auth instead of Clerk
