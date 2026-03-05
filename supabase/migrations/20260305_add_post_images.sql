-- Add image_url column to posts table for community image posts
alter table public.posts add column if not exists image_url text;
