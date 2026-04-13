# OhmPlace: Image Messages, Bug Fixes Design
**Date:** 2026-03-31  
**Status:** Approved

---

## Overview

Four changes to OhmPlace:

1. Fix boost wiping listing images (1-line bug fix)
2. Fix "user user" display name in conversations
3. Add image/sticker messages to DMs
4. Add image/sticker attachments to community post comments

---

## Bug Fix 1: Boost Wipes Listing Image

### Problem
When a listing is boosted and the Stripe webhook fires, Supabase real-time sends an UPDATE event for the `listings` table. The marketplace page merges `payload.new` over the existing listing state with `{ ...l, ...updated }`. Because `listing_images` is a separate table, `payload.new` can include `images: null` or `images: []`, overwriting the in-memory images array and making the listing image disappear.

### Fix
In `src/app/dashboard/marketplace/page.tsx`, the UPDATE handler explicitly preserves the existing images:

```ts
// Before
l.id === updated.id ? { ...l, ...updated } : l

// After
l.id === updated.id ? { ...l, ...updated, images: l.images } : l
```

**Files changed:** `src/app/dashboard/marketplace/page.tsx`

---

## Bug Fix 2: "User User" Display Name

### Problem
Exact Clerk-side root cause TBD (requires Clerk dashboard access). The string "user user" is reaching the UI from either `profiles.full_name` (written by `sync-profile`) or from the Clerk user object used as fallback in `GET /api/conversations`. The fix is defensive — sanitize bad/placeholder names at both layers.

### Fix

**In `src/app/api/sync-profile/route.ts`:** Sanitize `full_name` after computing it. If it matches a placeholder pattern, fall back to email prefix:

```ts
const rawName = clerkUser.fullName ||
  [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
  authUser.email.split('@')[0]

const isPlaceholder = (name: string) => {
  const lower = name.toLowerCase().trim()
  const parts = lower.split(' ')
  return !name ||
    lower === 'unknown user' ||
    parts.every(p => p === 'user') ||
    (parts.length > 1 && new Set(parts).size === 1)  // catches any "x x" repeat
}

const full_name = isPlaceholder(rawName) ? authUser.email.split('@')[0] : rawName
```

**In `src/app/api/conversations/route.ts`:** Apply the same `isPlaceholder` check when building `clerk?.full_name` from the Clerk user object before it's used as a fallback for `other_user.full_name`.

**Files changed:** `src/app/api/sync-profile/route.ts`, `src/app/api/conversations/route.ts`

---

## Feature 1: Image Messages in DMs

### Database
```sql
ALTER TABLE public.messages ADD COLUMN image_url TEXT;
```

A message may have text, image_url, or both. Text is no longer required when image_url is present.

### Storage
New Supabase storage bucket: `message-images` (public read).

Upload path: `message-images/{conversationId}/{uuid}.{ext}`

New function in `src/lib/supabase/storage.ts`:
```ts
uploadMessageImage(file: File, conversationId: string): Promise<string>
```
Same pattern as existing `uploadListingImage` / `uploadPostImage`. Max 5MB, JPEG/PNG/WebP/GIF. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.

### API changes — `POST /api/conversations/[id]/messages`
- Accept optional `image_url: string` in request body
- Validation: require at least one of `text` (non-empty) or `image_url`
- Store `image_url` on the created message row
- `last_message_text` in conversations table: if image-only, set to `"📷 Image"`

### TypeScript types
Add `image_url?: string | null` to the `Message` type in `src/types/database.ts`.

### UI — Message Input (`src/app/dashboard/messages/page.tsx`)
- Image button (image icon) sits to the left of the text input
- Clicking it opens a native file picker (accept: image/*)
- After selection: show a small preview thumbnail above the input with an ✕ to remove
- Sending: upload image first → get URL → send message with `image_url` (and text if any)
- Loading state on the send button while uploading
- Text input placeholder changes to "Add a caption..." when an image is selected

### UI — Message Bubble display
- Image renders below text (if both present) inside the bubble
- Max display: `max-h-64 w-full rounded-xl object-cover`
- Clicking the image opens it in a new tab (full resolution)
- Image-only messages show no text area

---

## Feature 2: Image Attachments in Community Post Comments

### Database
```sql
ALTER TABLE public.comments ADD COLUMN image_url TEXT;
```

Same rule: comment may have body text, image_url, or both.

### Storage
Reuse the `message-images` bucket with path: `message-images/comments/{postId}/{uuid}.{ext}`

New function in `src/lib/supabase/storage.ts`:
```ts
uploadCommentImage(file: File, postId: string): Promise<string>
```

### API changes — `POST /api/community/posts/[id]/comments`
- Accept optional `image_url: string`
- Require at least one of `body` (non-empty) or `image_url`
- Store `image_url` on the comment row

### TypeScript types
Add `image_url?: string | null` to the comment type in `src/types/database.ts`.

### UI — Comment Input (`src/components/community/CommentSection.tsx`)
- Image button next to the comment submit button
- Same pattern: file picker → thumbnail preview → ✕ to remove
- On submit: upload image first → attach URL → submit comment

### UI — Comment display
- Image renders below comment body text
- Same styling as DM images: `max-h-48 w-full rounded-xl object-cover`
- Clicking opens full size in new tab

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/app/dashboard/marketplace/page.tsx` | Bug fix: preserve images on real-time UPDATE |
| `src/app/api/sync-profile/route.ts` | Bug fix: sanitize placeholder names from Clerk |
| `src/app/api/conversations/route.ts` | Bug fix: sanitize Clerk name fallback in conversation enrichment |
| `src/lib/supabase/storage.ts` | Add `uploadMessageImage`, `uploadCommentImage` |
| `src/types/database.ts` | Add `image_url` to Message and comment types |
| `src/app/dashboard/messages/page.tsx` | Image attach button, preview, bubble display |
| `src/app/api/conversations/[id]/messages/route.ts` | Accept + store `image_url`, relax text validation |
| `src/components/community/CommentSection.tsx` | Image attach button, preview, comment image display |
| `src/app/api/community/posts/[id]/comments/route.ts` | Accept + store `image_url`, relax body validation |
| Database (Supabase) | `ALTER TABLE messages ADD COLUMN image_url TEXT` |
| Database (Supabase) | `ALTER TABLE comments ADD COLUMN image_url TEXT` |
| Supabase Storage | Create `message-images` bucket |

---

## Out of Scope
- Multiple images per message/comment (can be added later by extending `image_url` to an array)
- Image compression/resizing
- Video attachments
- Animated GIF support beyond basic rendering (GIFs will display but not be special-cased)
