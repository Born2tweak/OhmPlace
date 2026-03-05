-- ============================================================
-- PRODUCTION RLS POLICIES
-- Run this in the Supabase SQL editor to replace the
-- wide-open dev policies with proper per-user authorization.
-- ============================================================

-- 1. Drop old dev policies
drop policy if exists "Enable all access for local dev" on public.conversations;
drop policy if exists "Enable all access for local dev" on public.messages;
drop policy if exists "Enable all access for local dev" on public.posts;
drop policy if exists "Enable all access for local dev" on public.post_votes;
drop policy if exists "Enable all access for local dev" on public.comments;
drop policy if exists "Allow all for hybrid profiles" on public.profiles;

-- 2. PROFILES — anyone can read, only owner can update
create policy "Anyone can read profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can insert own profile"
  on public.profiles for insert with check (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 3. CONVERSATIONS — participants only
create policy "Participants can view conversations"
  on public.conversations for select
  using (
    participant_1 = current_setting('request.jwt.claims', true)::json->>'sub'
    OR participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
  );

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check (
    participant_1 = current_setting('request.jwt.claims', true)::json->>'sub'
    OR participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
  );

create policy "Participants can update conversations"
  on public.conversations for update
  using (
    participant_1 = current_setting('request.jwt.claims', true)::json->>'sub'
    OR participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- 4. MESSAGES — conversation participants only
create policy "Participants can view messages"
  on public.messages for select
  using (
    conversation_id in (
      select id from public.conversations
      where participant_1 = current_setting('request.jwt.claims', true)::json->>'sub'
         OR participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    sender_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

create policy "Participants can update message status"
  on public.messages for update
  using (
    conversation_id in (
      select id from public.conversations
      where participant_1 = current_setting('request.jwt.claims', true)::json->>'sub'
         OR participant_2 = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- 5. POSTS — campus-scoped read, owner write
create policy "Anyone can read posts"
  on public.posts for select using (true);

create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Owners can update posts"
  on public.posts for update
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Owners can delete posts"
  on public.posts for delete
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 6. POST_VOTES — own votes only
create policy "Anyone can read votes"
  on public.post_votes for select using (true);

create policy "Users can insert own votes"
  on public.post_votes for insert
  with check (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can update own votes"
  on public.post_votes for update
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Users can delete own votes"
  on public.post_votes for delete
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 7. COMMENTS — public read, owner write
create policy "Anyone can read comments"
  on public.comments for select using (true);

create policy "Authenticated users can create comments"
  on public.comments for insert
  with check (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

create policy "Owners can delete comments"
  on public.comments for delete
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
