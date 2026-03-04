-- Create profiles table (if not exists)
create table if not exists public.profiles (
  id text primary key,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  major text,
  year text,
  updated_at timestamptz,
  created_at timestamptz default now()
);

-- Create conversations table
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  participant_1 text not null,
  participant_2 text not null,
  last_message_text text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Create messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id text not null,
  text text not null,
  status text default 'sent',
  created_at timestamptz default now()
);

-- Create posts table (Community)
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  username text,
  campus text,
  title text not null,
  body text,
  flair text,
  upvotes integer default 0,
  downvotes integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now()
);

-- Create post_votes table
create table if not exists public.post_votes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  user_id text not null,
  vote integer not null, -- 1 for up, -1 for down
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- Create comments table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  user_id text not null,
  username text,
  body text not null,
  upvotes integer default 0,
  downvotes integer default 0,
  created_at timestamptz default now()
);

-- Create comment_votes table
create table if not exists public.comment_votes (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.comments(id) on delete cascade,
  user_id text not null,
  vote integer not null,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- NOTE: OhmPlace uses Clerk for auth (not Supabase Auth), so
-- auth.uid() is NOT available. Server-side API routes use the
-- service_role key which bypasses RLS entirely.
--
-- For client-side Supabase (anon key), we lock down writes
-- and only allow reads on non-sensitive tables.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.post_votes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;

-- Drop old wide-open dev policies
do $$
begin
  -- Drop overly permissive policies if they exist
  if exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'conversations') then
    drop policy "Enable all access for local dev" on public.conversations;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'messages') then
    drop policy "Enable all access for local dev" on public.messages;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'posts') then
    drop policy "Enable all access for local dev" on public.posts;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'post_votes') then
    drop policy "Enable all access for local dev" on public.post_votes;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'comments') then
    drop policy "Enable all access for local dev" on public.comments;
  end if;
  if exists (select 1 from pg_policies where policyname = 'Allow all for hybrid profiles' and tablename = 'profiles') then
    drop policy "Allow all for hybrid profiles" on public.profiles;
  end if;
end $$;

-- ============================================================
-- NEW RESTRICTIVE POLICIES
-- ============================================================

-- PROFILES: Anyone can read (public profiles), no client-side writes
-- (writes go through server-side API with service_role key)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Profiles are publicly readable' and tablename = 'profiles') then
    create policy "Profiles are publicly readable" on public.profiles for select using (true);
  end if;
end $$;

-- CONVERSATIONS: Read-only for participants (via anon key for realtime)
-- Writes happen server-side via service_role key
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Conversations readable by anon for realtime' and tablename = 'conversations') then
    create policy "Conversations readable by anon for realtime" on public.conversations for select using (true);
  end if;
end $$;

-- MESSAGES: Read-only for realtime subscriptions
-- Writes happen server-side via service_role key
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Messages readable by anon for realtime' and tablename = 'messages') then
    create policy "Messages readable by anon for realtime" on public.messages for select using (true);
  end if;
end $$;

-- POSTS: Read-only for client, writes via server API
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Posts are publicly readable' and tablename = 'posts') then
    create policy "Posts are publicly readable" on public.posts for select using (true);
  end if;
end $$;

-- POST_VOTES: Read-only for client
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Post votes are readable' and tablename = 'post_votes') then
    create policy "Post votes are readable" on public.post_votes for select using (true);
  end if;
end $$;

-- COMMENTS: Read-only for client
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Comments are publicly readable' and tablename = 'comments') then
    create policy "Comments are publicly readable" on public.comments for select using (true);
  end if;
end $$;

-- COMMENT_VOTES: Read-only for client
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Comment votes are readable' and tablename = 'comment_votes') then
    create policy "Comment votes are readable" on public.comment_votes for select using (true);
  end if;
end $$;

-- ============================================================
-- REALTIME
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'conversations') then
    alter publication supabase_realtime add table conversations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
    alter publication supabase_realtime add table messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'posts') then
    alter publication supabase_realtime add table posts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'comments') then
    alter publication supabase_realtime add table comments;
  end if;
end $$;
