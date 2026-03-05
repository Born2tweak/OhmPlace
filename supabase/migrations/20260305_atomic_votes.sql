-- Atomic vote increment functions (prevents race conditions)

-- For post votes
create or replace function public.increment_post_votes(
  p_post_id uuid,
  p_up_delta integer,
  p_down_delta integer
)
returns void
language sql
as $$
  update public.posts
  set
    upvotes = greatest(0, upvotes + p_up_delta),
    downvotes = greatest(0, downvotes + p_down_delta)
  where id = p_post_id;
$$;

-- For comment votes
create or replace function public.increment_comment_votes(
  p_comment_id uuid,
  p_up_delta integer,
  p_down_delta integer
)
returns void
language sql
as $$
  update public.comments
  set
    upvotes = greatest(0, upvotes + p_up_delta),
    downvotes = greatest(0, downvotes + p_down_delta)
  where id = p_comment_id;
$$;
