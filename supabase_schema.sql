-- Create profiles table (if not exists)
create table if not exists public.profiles (
  id text primary key,
  email text,
  full_name text,
  avatar_url text,
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
  comments_count integer default 0,
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
  user_id text not null,
  username text,
  content text not null,
  likes_count integer default 0,
  created_at timestamptz default now()
);

-- Enable RLS on all
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.post_votes enable row level security;
alter table public.comments enable row level security;

-- Policies (Safe creation)
do $$
begin
  -- Profiles
  if not exists (select 1 from pg_policies where policyname = 'Public profiles' and tablename = 'profiles') then
    create policy "Public profiles" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow all for hybrid profiles' and tablename = 'profiles') then
    create policy "Allow all for hybrid profiles" on public.profiles for all using (true) with check (true);
  end if;

  -- Conversations
  if not exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'conversations') then
      create policy "Enable all access for local dev" on public.conversations for all using (true) with check (true);
  end if;

  -- Messages
  if not exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'messages') then
      create policy "Enable all access for local dev" on public.messages for all using (true) with check (true);
  end if;

  -- Posts
  if not exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'posts') then
      create policy "Enable all access for local dev" on public.posts for all using (true) with check (true);
  end if;

  -- Post Votes
  if not exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'post_votes') then
      create policy "Enable all access for local dev" on public.post_votes for all using (true) with check (true);
  end if;

  -- Comments
  if not exists (select 1 from pg_policies where policyname = 'Enable all access for local dev' and tablename = 'comments') then
      create policy "Enable all access for local dev" on public.comments for all using (true) with check (true);
  end if;
end $$;

-- Enable Realtime
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
