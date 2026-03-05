-- Atomic vote increment function (prevents race conditions)
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
