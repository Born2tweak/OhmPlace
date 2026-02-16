# Community Tab Implementation Plan

## Overview
Reddit-style community feed scoped to each campus (derived from .edu email domain). Users see posts from their university community with upvote/downvote, comments, post flairs, and sort options.

---

## 1. Database Schema (New Migration: `003_create_community.sql`)

### Tables

**`posts`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | TEXT | Clerk user ID |
| username | TEXT | Display name |
| campus | TEXT | Extracted from email (e.g., "purdue.edu") |
| title | TEXT | Max 200 chars |
| body | TEXT | Max 5000 chars, nullable |
| flair | TEXT | nullable (e.g., "Rant/Vent", "Question", "Discussion", "Buying", "Selling", "Project") |
| upvotes | INT | Default 0 |
| downvotes | INT | Default 0 |
| comment_count | INT | Default 0 (denormalized for perf) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**`post_votes`** (tracks who voted on what)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| post_id | UUID FK | References posts |
| user_id | TEXT | Clerk user ID |
| vote | INT | +1 or -1 |
| UNIQUE(post_id, user_id) | | One vote per user per post |

**`comments`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| post_id | UUID FK | References posts |
| user_id | TEXT | Clerk user ID |
| username | TEXT | Display name |
| body | TEXT | Max 2000 chars |
| upvotes | INT | Default 0 |
| downvotes | INT | Default 0 |
| created_at | TIMESTAMPTZ | |

**`comment_votes`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| comment_id | UUID FK | References comments |
| user_id | TEXT | Clerk user ID |
| vote | INT | +1 or -1 |
| UNIQUE(comment_id, user_id) | | |

### Indexes
- `idx_posts_campus` on posts(campus)
- `idx_posts_created_at` on posts(created_at DESC)
- `idx_post_votes_post_id` on post_votes(post_id)
- `idx_post_votes_user_post` on post_votes(user_id, post_id)
- `idx_comments_post_id` on comments(post_id)
- `idx_comment_votes_comment_id` on comment_votes(comment_id)

---

## 2. API Routes

All API routes verify Clerk session, extract campus from user email, and use Supabase service role key.

### `POST /api/community/posts` — Create a post
- Auth required, extract campus from email
- Body: `{ title, body, flair }`

### `GET /api/community/posts` — Get posts feed
- Query params: `?sort=best|new|hot`
- Filters to user's campus
- Returns posts with user's vote status

### `GET /api/community/posts/[id]` — Get single post with comments
- Returns post detail + all comments
- Includes user's vote status on post and each comment

### `POST /api/community/posts/[id]/vote` — Vote on a post
- Body: `{ vote: 1 | -1 | 0 }` (0 = remove vote)
- Upserts into post_votes, updates post upvotes/downvotes

### `POST /api/community/posts/[id]/comments` — Add comment
- Body: `{ body }`
- Increments post comment_count

### `POST /api/community/comments/[id]/vote` — Vote on a comment
- Body: `{ vote: 1 | -1 | 0 }`

### `DELETE /api/community/posts/[id]` — Delete own post

---

## 3. UI Components

### New Components
1. **`PostCard.tsx`** — Feed card for each post
   - Shows: flair badge, title, body preview (truncated), username, time ago, campus badge
   - Action bar: upvote/downvote with score, comment count, share button
   - Clicking opens post detail

2. **`CreatePostModal.tsx`** — Modal to create a new post
   - Title input, body textarea, flair selector dropdown
   - Submit button

3. **`CommentSection.tsx`** — Comments list for post detail
   - "Join the conversation" input at top
   - Sort dropdown (Best, New)
   - List of comments with vote buttons

4. **`VoteButton.tsx`** — Reusable upvote/downvote component
   - Up arrow, score, down arrow
   - Highlights active vote state (teal for upvote, red-ish for downvote)

5. **`FlairBadge.tsx`** — Colored flair/tag pill
   - Different colors per flair type

### Pages
1. **`/dashboard/community`** — Main feed page (rewrite existing placeholder)
   - Campus header (e.g., "purdue.edu Community")
   - Create Post button
   - Sort tabs (Best / New / Hot)
   - Post feed (list of PostCard)

2. **`/dashboard/community/[id]`** — Post detail page
   - Back button
   - Full post content
   - Comment section

---

## 4. Implementation Order

1. **Database**: Create migration SQL file with all 4 tables + indexes
2. **API Routes**: Build all 6 endpoints
3. **Components**: Build VoteButton, FlairBadge, PostCard, CreatePostModal, CommentSection
4. **Pages**: Build community feed page and post detail page
5. **Polish**: Sort logic (hot = score decay over time), empty states, loading states

---

## 5. Design Notes

- **Color scheme**: Stays consistent with existing teal/crystal theme (#22c1c3)
- **Card style**: White cards with soft shadow (matching existing `.card` pattern)
- **Flair colors**: Each flair type gets a distinct color (e.g., red for Rant/Vent, blue for Question, green for Discussion)
- **Vote buttons**: Teal when upvoted, muted red when downvoted, gray when neutral
- **Campus extraction**: Parse `@purdue.edu` → `purdue.edu` from Clerk user email
- **Time display**: Relative time (e.g., "4h ago", "2d ago")
