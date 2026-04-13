# Image Messages & Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the boost image disappear bug and "user user" display bug, then add image/sticker attachment support to DMs and community post comments.

**Architecture:** Two independent bug fixes (1-line and name sanitization), followed by a shared storage layer for image uploads, then API + UI changes for DMs and comments. All image uploads go through the Supabase `message-images` bucket using the same pattern already used for listing and post images.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Storage), Clerk auth, TypeScript, Tailwind/CSS variables, Lucide icons, Zod validation

---

## File Map

| File | Change |
|------|--------|
| `src/app/dashboard/marketplace/page.tsx` | 1-line bug fix: preserve images on realtime UPDATE |
| `src/app/api/sync-profile/route.ts` | Add `isPlaceholder` sanitizer for bad Clerk names |
| `src/app/api/conversations/route.ts` | Apply same sanitizer to Clerk fallback name in GET |
| `src/lib/supabase/storage.ts` | Add `uploadMessageImage`, `uploadCommentImage` |
| `src/types/database.ts` | Add `image_url` to messages and comments rows/inserts |
| `src/app/api/conversations/[id]/messages/route.ts` | Accept optional `image_url`, relax text validation |
| `src/app/api/community/posts/[id]/comments/route.ts` | Accept optional `image_url` in Zod schema, relax body validation |
| `src/app/dashboard/messages/page.tsx` | Image attach button, preview, bubble image display |
| `src/components/community/CommentSection.tsx` | Image attach button + preview in both top-level and reply inputs; image display in CommentItem |
| `supabase_schema.sql` | Document the two ALTER TABLE statements |

---

## Task 1: Database Migrations

**Files:**
- Modify: `supabase_schema.sql` (documentation only)
- Action: Run SQL in Supabase dashboard

- [ ] **Step 1: Run migrations in Supabase SQL Editor**

Open https://supabase.com/dashboard → your project → SQL Editor → New query. Run each statement separately:

```sql
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;
```

```sql
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS image_url TEXT;
```

- [ ] **Step 2: Create the message-images storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `message-images`
- Public: ✅ (checked)
- File size limit: 5MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`

- [ ] **Step 3: Verify migrations**

In Supabase SQL Editor run:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'messages' AND column_name = 'image_url';
```
Expected: 1 row returned.

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'comments' AND column_name = 'image_url';
```
Expected: 1 row returned.

- [ ] **Step 4: Document migrations in supabase_schema.sql**

Open `supabase_schema.sql`. After the existing `create table if not exists public.messages` block, add:

```sql
-- Add image support to messages (run once)
-- ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;
```

After the `create table if not exists public.comments` block, add:

```sql
-- Add image support to comments (run once)
-- ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS image_url TEXT;
```

- [ ] **Step 5: Commit**

```bash
git add supabase_schema.sql
git commit -m "chore: document image_url migrations for messages and comments"
```

---

## Task 2: Fix Boost Image Disappear Bug

**Files:**
- Modify: `src/app/dashboard/marketplace/page.tsx`

- [ ] **Step 1: Apply the fix**

In `src/app/dashboard/marketplace/page.tsx`, find the UPDATE real-time handler at line ~113. Change:

```ts
setListings(prev => prev.map(l =>
    l.id === updated.id ? { ...l, ...updated } : l
))
```

To:

```ts
setListings(prev => prev.map(l =>
    l.id === updated.id ? { ...l, ...updated, images: l.images } : l
))
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd c:\Users\bboyi\Desktop\projects\ohmplace
npm run build
```
Expected: Build succeeds (or same errors as before — no new errors).

- [ ] **Step 3: Manual test**

1. Go to `/dashboard/marketplace` — verify listings show images
2. Boost a listing (or simulate by manually setting `promoted=true` + `promoted_until` in Supabase)
3. The listing image should remain visible and the "Promoted" badge should appear

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/marketplace/page.tsx
git commit -m "fix: preserve listing images when boost realtime UPDATE fires"
```

---

## Task 3: Fix "User User" Display Name

**Files:**
- Modify: `src/app/api/sync-profile/route.ts`
- Modify: `src/app/api/conversations/route.ts`

- [ ] **Step 1: Add isPlaceholder helper and sanitize in sync-profile**

Replace the `full_name` computation in `src/app/api/sync-profile/route.ts`. The current code is:

```ts
const full_name = clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    authUser.username ||
    authUser.email.split('@')[0]
```

Replace with:

```ts
function isPlaceholderName(name: string | null | undefined): boolean {
    if (!name) return true
    const lower = name.toLowerCase().trim()
    const parts = lower.split(/\s+/)
    return (
        lower === 'unknown user' ||
        parts.every(p => p === 'user') ||
        (parts.length > 1 && new Set(parts).size === 1)
    )
}

const rawName =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    null

const full_name = isPlaceholderName(rawName)
    ? authUser.email.split('@')[0]
    : rawName!
```

- [ ] **Step 2: Apply same sanitizer in conversations GET**

In `src/app/api/conversations/route.ts`, find the Clerk user mapping (~line 63):

```ts
const clerkUsers = (clerkResponse.data || []).map((user): ClerkUserSummary => ({
    id: user.id,
    full_name:
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.username ||
        null,
    email: user.primaryEmailAddress?.emailAddress || '',
    clerk_avatar: user.imageUrl,
}))
```

Replace with:

```ts
function isPlaceholderName(name: string | null | undefined): boolean {
    if (!name) return true
    const lower = name.toLowerCase().trim()
    const parts = lower.split(/\s+/)
    return (
        lower === 'unknown user' ||
        parts.every(p => p === 'user') ||
        (parts.length > 1 && new Set(parts).size === 1)
    )
}

const clerkUsers = (clerkResponse.data || []).map((user): ClerkUserSummary => ({
    id: user.id,
    full_name: (() => {
        const raw =
            user.fullName ||
            [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            user.username ||
            null
        if (isPlaceholderName(raw)) return null
        return raw
    })(),
    email: user.primaryEmailAddress?.emailAddress || '',
    clerk_avatar: user.imageUrl,
}))
```

Note: returning `null` here means the display falls back to `profile?.full_name` or the email prefix via `getDisplayName` in the messages page.

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: No new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/sync-profile/route.ts src/app/api/conversations/route.ts
git commit -m "fix: sanitize placeholder names from Clerk in sync-profile and conversations"
```

---

## Task 4: Add Storage Upload Functions

**Files:**
- Modify: `src/lib/supabase/storage.ts`

- [ ] **Step 1: Add uploadMessageImage and uploadCommentImage**

In `src/lib/supabase/storage.ts`, after the existing `uploadPostImage` function, add:

```ts
const ALLOWED_TYPES_WITH_GIF = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export async function uploadMessageImage(
    file: File,
    conversationId: string
): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 5MB')
    }

    if (!ALLOWED_TYPES_WITH_GIF.includes(file.type)) {
        throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed')
    }

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${conversationId}/${crypto.randomUUID()}.${fileExt}`

    const { data, error } = await supabase.storage
        .from('message-images')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        console.error('Upload error:', error)
        throw new Error('Failed to upload image')
    }

    const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(data.path)

    return publicUrl
}

export async function uploadCommentImage(
    file: File,
    postId: string
): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 5MB')
    }

    if (!ALLOWED_TYPES_WITH_GIF.includes(file.type)) {
        throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed')
    }

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `comments/${postId}/${crypto.randomUUID()}.${fileExt}`

    const { data, error } = await supabase.storage
        .from('message-images')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        console.error('Upload error:', error)
        throw new Error('Failed to upload image')
    }

    const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(data.path)

    return publicUrl
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/storage.ts
git commit -m "feat: add uploadMessageImage and uploadCommentImage storage functions"
```

---

## Task 5: Update TypeScript Types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add image_url to messages type**

In `src/types/database.ts`, find the `messages` table definition (~line 127). Update all three sub-objects:

```ts
messages: {
    Row: {
        id: string
        conversation_id: string
        sender_id: string
        text: string
        status: 'sent' | 'delivered' | 'read'
        created_at: string
        image_url: string | null
    }
    Insert: {
        id?: string
        conversation_id: string
        sender_id: string
        text: string
        status?: 'sent' | 'delivered' | 'read'
        created_at?: string
        image_url?: string | null
    }
    Update: {
        status?: 'sent' | 'delivered' | 'read'
        image_url?: string | null
    }
}
```

- [ ] **Step 2: Add image_url to comments type**

Find the `comments` table definition (~line 206). Update all three sub-objects:

```ts
comments: {
    Row: {
        id: string
        post_id: string
        parent_id: string | null
        user_id: string
        username: string | null
        body: string
        upvotes: number
        downvotes: number
        created_at: string
        image_url: string | null
    }
    Insert: {
        id?: string
        post_id: string
        parent_id?: string | null
        user_id: string
        username?: string | null
        body: string
        upvotes?: number
        downvotes?: number
        created_at?: string
        image_url?: string | null
    }
    Update: {
        body?: string
        upvotes?: number
        downvotes?: number
        image_url?: string | null
    }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add image_url to Message and Comment types"
```

---

## Task 6: Update Messages API

**Files:**
- Modify: `src/app/api/conversations/[id]/messages/route.ts`

- [ ] **Step 1: Update POST handler to accept image_url**

Replace the entire POST handler body in `src/app/api/conversations/[id]/messages/route.ts` with:

```ts
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    const supabase = getSupabase()

    const convo = await validateParticipant(supabase, conversationId, authUser.userId)
    if (!convo) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    let body: { text?: string; image_url?: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { text, image_url } = body

    const trimmedText = typeof text === 'string' ? text.trim() : ''
    const hasText = trimmedText.length > 0
    const hasImage = typeof image_url === 'string' && image_url.startsWith('https://')

    if (!hasText && !hasImage) {
        return NextResponse.json(
            { error: 'Message must contain text or an image' },
            { status: 400 }
        )
    }

    if (hasText && trimmedText.length > 2000) {
        return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
    }

    try {
        const { data: message, error: insertError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: authUser.userId,
                text: trimmedText,
                status: 'sent',
                image_url: hasImage ? image_url : null,
            })
            .select('*')
            .single()

        if (insertError) {
            console.error('Error sending message:', insertError)
            return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
        }

        const lastMessageText = hasText ? trimmedText : '📷 Image'

        await supabase
            .from('conversations')
            .update({
                last_message_text: lastMessageText,
                last_message_at: new Date().toISOString(),
            })
            .eq('id', conversationId)

        return NextResponse.json(message)
    } catch (error) {
        console.error('Messages POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: No errors.

- [ ] **Step 3: Manual test via curl (optional)**

```bash
# Replace TOKEN and IDs with real values from your browser's network tab
curl -X POST https://your-app.vercel.app/api/conversations/CONVO_ID/messages \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_CLERK_SESSION" \
  -d '{"image_url": "https://fvboileebqrtghzxrkcg.supabase.co/storage/v1/object/public/message-images/test.jpg"}'
```
Expected: 200 with message object containing `image_url`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/conversations/[id]/messages/route.ts
git commit -m "feat: messages API accepts image_url, text optional when image present"
```

---

## Task 7: Update Comments API

**Files:**
- Modify: `src/app/api/community/posts/[id]/comments/route.ts`

- [ ] **Step 1: Update CommentSchema and POST handler**

Replace the entire file content of `src/app/api/community/posts/[id]/comments/route.ts` with:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

const CommentSchema = z.object({
    body: z.string().max(2000, 'Comment too long (max 2000 chars)').optional().default(''),
    parent_id: z.string().uuid().optional().nullable(),
    image_url: z.string().url().optional().nullable(),
}).refine(
    (data) => (data.body && data.body.trim().length > 0) || (data.image_url && data.image_url.length > 0),
    { message: 'Comment must contain text or an image' }
)

// POST /api/community/posts/[id]/comments
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await params

    let rawBody: unknown
    try {
        rawBody = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const parsed = CommentSchema.safeParse(rawBody)
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || 'Invalid input' },
            { status: 400 }
        )
    }

    const { body, parent_id, image_url } = parsed.data
    const supabase = getSupabase()

    // Verify post exists
    const { data: post } = await supabase
        .from('posts')
        .select('id, comment_count')
        .eq('id', postId)
        .single() as { data: { id: string; comment_count: number } | null }

    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If replying to a comment, verify parent exists
    if (parent_id) {
        const { data: parentComment } = await supabase
            .from('comments')
            .select('id')
            .eq('id', parent_id)
            .eq('post_id', postId)
            .single()

        if (!parentComment) {
            return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
        }
    }

    // Create comment
    const { data: comment, error } = await supabase
        .from('comments')
        .insert({
            post_id: postId,
            user_id: user.userId,
            username: user.username,
            body: body?.trim() || '',
            parent_id: parent_id || null,
            image_url: image_url || null,
        })
        .select()
        .single() as { data: Record<string, unknown> | null; error: { message: string } | null }

    if (error) {
        console.error('Failed to create comment:', error)
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Increment comment count
    await supabase
        .from('posts')
        .update({ comment_count: post.comment_count + 1 })
        .eq('id', postId)

    return NextResponse.json({ ...comment, userVote: 0 }, { status: 201 })
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/community/posts/[id]/comments/route.ts
git commit -m "feat: comments API accepts image_url, body optional when image present"
```

---

## Task 8: DM Image UI

**Files:**
- Modify: `src/app/dashboard/messages/page.tsx`

This task has three sub-parts: (A) attach button + upload state, (B) image preview before send, (C) image display in message bubble.

- [ ] **Step 1: Add image state and file input ref**

In `src/app/dashboard/messages/page.tsx`, find the existing state declarations (around line 55). Add these alongside the existing state:

```ts
const [pendingImage, setPendingImage] = useState<File | null>(null)
const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null)
const [uploadingImage, setUploadingImage] = useState(false)
const imageInputRef = useRef<HTMLInputElement>(null)
```

Also add `uploadMessageImage` to the imports at the top of the file:

```ts
import { uploadMessageImage } from '@/lib/supabase/storage'
```

And add `ImageIcon, X as XIcon` to the lucide imports (the file already imports `X` — rename it or use `X` for the existing usage and `XIcon` for the new one. Check the existing import: `import { ..., X, ... } from 'lucide-react'` — just add `Image as ImageIcon` to that import).

- [ ] **Step 2: Add image selection handler**

In the `MessagesContent` component, add this function alongside `handleSend`:

```ts
const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImage(file)
    setPendingImageUrl(URL.createObjectURL(file))
    // Reset input so same file can be re-selected
    e.target.value = ''
}

const clearPendingImage = () => {
    if (pendingImageUrl) URL.revokeObjectURL(pendingImageUrl)
    setPendingImage(null)
    setPendingImageUrl(null)
}
```

- [ ] **Step 3: Update handleSend to upload image before sending**

Replace the existing `handleSend` function with:

```ts
const handleSend = async () => {
    if ((!messageInput.trim() && !pendingImage) || !selectedConvoId || !user) return

    const text = messageInput.trim()
    setMessageInput('')

    let uploadedImageUrl: string | null = null

    if (pendingImage) {
        setUploadingImage(true)
        try {
            uploadedImageUrl = await uploadMessageImage(pendingImage, selectedConvoId)
        } catch (err) {
            console.error('Image upload failed:', err)
            toast('Failed to upload image', 'error')
            setUploadingImage(false)
            return
        } finally {
            setUploadingImage(false)
        }
        clearPendingImage()
    }

    const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: selectedConvoId,
        sender_id: user.id,
        text,
        status: 'sent',
        created_at: new Date().toISOString(),
        image_url: uploadedImageUrl,
    }

    setMessages(prev => [...prev, optimisticMsg])

    try {
        const res = await fetch(`/api/conversations/${selectedConvoId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, image_url: uploadedImageUrl }),
        })

        if (!res.ok) {
            const data = await res.json() as { error?: string }
            toast(data.error || 'Failed to send message', 'error')
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        } else {
            const realMsg = await res.json() as Message
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? realMsg : m))
        }
    } catch {
        toast('Failed to send message', 'error')
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
    }
}
```

- [ ] **Step 4: Add image attach button + preview to the message input area**

Find the message input area in the JSX (search for `messageInput` in the render). It currently looks like a row with a text input and send button. Replace that entire input row with:

```tsx
{/* Image preview above input */}
{pendingImageUrl && (
    <div className="relative inline-block mb-2 ml-2">
        <img
            src={pendingImageUrl}
            alt="Attachment preview"
            className="h-20 w-auto rounded-xl object-cover border"
            style={{ border: '1px solid var(--border-subtle)' }}
        />
        <button
            onClick={clearPendingImage}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center"
        >
            <X className="w-3 h-3" />
        </button>
    </div>
)}

<div className="flex gap-2 items-center">
    {/* Hidden file input */}
    <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
    />

    {/* Image attach button */}
    <button
        type="button"
        onClick={() => imageInputRef.current?.click()}
        disabled={uploadingImage}
        className="p-2 rounded-full transition-colors hover:opacity-80 flex-shrink-0"
        style={{ color: 'var(--text-muted)', background: 'var(--bg-lighter)' }}
        title="Attach image"
    >
        <ImageIcon className="w-5 h-5" />
    </button>

    {/* Text input */}
    <input
        type="text"
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
            }
        }}
        placeholder={pendingImage ? 'Add a caption...' : 'Type a message...'}
        className="flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2"
        style={{
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-lighter)',
            color: 'var(--text-primary)',
        }}
        disabled={uploadingImage}
    />

    {/* Send button */}
    <button
        onClick={() => void handleSend()}
        disabled={(!messageInput.trim() && !pendingImage) || uploadingImage}
        className="p-2.5 rounded-full text-white transition-colors disabled:opacity-40 flex-shrink-0"
        style={{ background: 'var(--brand-primary)' }}
    >
        {uploadingImage ? (
            <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
            <Send className="w-5 h-5" />
        )}
    </button>
</div>
```

- [ ] **Step 5: Add image display in message bubbles**

Find where messages are rendered in the JSX — the message bubble section that shows `message.text`. After the text `<p>` tag, add image display:

```tsx
{/* Existing text display — keep as is */}
{message.text && (
    <p className="text-sm">{message.text}</p>
)}

{/* Image display */}
{message.image_url && (
    <a href={message.image_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img
            src={message.image_url}
            alt="Image"
            className="max-h-64 w-auto rounded-xl object-cover"
            style={{ maxWidth: '100%' }}
        />
    </a>
)}
```

Note: The existing code likely wraps `message.text` in a `<p>` directly. Replace that single `<p>{message.text}</p>` with the conditional block above so image-only messages don't render an empty paragraph.

- [ ] **Step 6: Verify build**

```bash
npm run build
```
Expected: No TypeScript errors.

- [ ] **Step 7: Manual test**

1. Open `/dashboard/messages`, start or open a conversation
2. Click the image icon → select an image file
3. Verify: thumbnail preview appears above input with ✕ button
4. Type an optional caption, press Send
5. Verify: image appears in the message bubble
6. Verify: last message in conversation list shows "📷 Image" (or caption if typed)
7. Test image-only (no caption): click ✕ on caption, send — verify image still sends

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/messages/page.tsx
git commit -m "feat: add image attachment support to DM messages"
```

---

## Task 9: Comment Image UI

**Files:**
- Modify: `src/components/community/CommentSection.tsx`

- [ ] **Step 1: Update Comment interface and add image_url to display**

At the top of `src/components/community/CommentSection.tsx`, update the `Comment` interface:

```ts
interface Comment {
    id: string
    user_id: string
    username: string
    body: string
    upvotes: number
    downvotes: number
    created_at: string
    userVote: number
    parent_id: string | null
    avatar_url?: string | null
    image_url?: string | null
}
```

Update the `CommentSectionProps` interface to pass image upload capability:

```ts
interface CommentSectionProps {
    comments: Comment[]
    currentUserId: string
    postAuthorId: string
    postId: string
    onAddComment: (body: string, parentId?: string, imageUrl?: string) => Promise<void>
    onVoteComment: (commentId: string, vote: number) => void
}
```

- [ ] **Step 2: Add image display in CommentItem**

In `CommentItem`, find the body paragraph (line ~126):

```tsx
<p className="text-sm mb-2 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{comment.body}</p>
```

Replace with:

```tsx
{comment.body && (
    <p className="text-sm mb-2 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{comment.body}</p>
)}
{comment.image_url && (
    <a href={comment.image_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
        <img
            src={comment.image_url}
            alt="Image"
            className="max-h-48 w-auto rounded-xl object-cover"
            style={{ maxWidth: '100%' }}
        />
    </a>
)}
```

- [ ] **Step 3: Add image state and upload logic to CommentSection**

Add the import at the top of the file:

```ts
import { Image as ImageIcon, X } from 'lucide-react'
import { uploadCommentImage } from '@/lib/supabase/storage'
```

In the `CommentSection` component, add new state alongside existing state:

```ts
const [commentImage, setCommentImage] = useState<File | null>(null)
const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null)
const [replyImage, setReplyImage] = useState<File | null>(null)
const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null)
const [uploadingComment, setUploadingComment] = useState(false)
const [uploadingReply, setUploadingReply] = useState(false)
const commentImageRef = useRef<HTMLInputElement>(null)
const replyImageRef = useRef<HTMLInputElement>(null)
```

Add a `useRef` import if not already present: `import React, { useState, useRef } from 'react'`

- [ ] **Step 4: Update handleSubmit to upload comment image**

Replace the existing `handleSubmit` with:

```ts
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newComment.trim() && !commentImage) || loading) return

    setLoading(true)
    setUploadingComment(!!commentImage)
    try {
        let imageUrl: string | undefined
        if (commentImage) {
            imageUrl = await uploadCommentImage(commentImage, props.postId)
            setCommentImage(null)
            if (commentImagePreview) URL.revokeObjectURL(commentImagePreview)
            setCommentImagePreview(null)
        }
        await onAddComment(newComment.trim(), undefined, imageUrl)
        setNewComment('')
    } finally {
        setLoading(false)
        setUploadingComment(false)
    }
}
```

Note: `props.postId` requires destructuring `postId` from props. Update the component signature:

```ts
export default function CommentSection({ comments, currentUserId, postAuthorId, postId, onAddComment, onVoteComment }: CommentSectionProps) {
```

- [ ] **Step 5: Update handleReplySubmit to upload reply image**

Replace the existing `handleReplySubmit` with:

```ts
const handleReplySubmit = async (parentId: string) => {
    if ((!replyText.trim() && !replyImage) || replyLoading) return

    setReplyLoading(true)
    setUploadingReply(!!replyImage)
    try {
        let imageUrl: string | undefined
        if (replyImage) {
            imageUrl = await uploadCommentImage(replyImage, postId)
            setReplyImage(null)
            if (replyImagePreview) URL.revokeObjectURL(replyImagePreview)
            setReplyImagePreview(null)
        }
        await onAddComment(replyText.trim(), parentId, imageUrl)
        setReplyText('')
        setReplyingTo(null)
    } finally {
        setReplyLoading(false)
        setUploadingReply(false)
    }
}
```

- [ ] **Step 6: Add image button + preview to top-level comment input**

Replace the existing `<form onSubmit={handleSubmit}>` block with:

```tsx
<form onSubmit={handleSubmit} className="mb-6">
    {/* Image preview */}
    {commentImagePreview && (
        <div className="relative inline-block mb-2">
            <img
                src={commentImagePreview}
                alt="Attachment preview"
                className="h-16 w-auto rounded-xl object-cover border"
                style={{ border: '1px solid var(--border-subtle)' }}
            />
            <button
                type="button"
                onClick={() => {
                    URL.revokeObjectURL(commentImagePreview)
                    setCommentImage(null)
                    setCommentImagePreview(null)
                }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    )}
    <div className="flex gap-2">
        <input
            ref={commentImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setCommentImage(file)
                setCommentImagePreview(URL.createObjectURL(file))
                e.target.value = ''
            }}
        />
        <button
            type="button"
            onClick={() => commentImageRef.current?.click()}
            className="p-2 rounded-full flex-shrink-0 transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-lighter)' }}
            title="Attach image"
        >
            <ImageIcon className="w-4 h-4" />
        </button>
        <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={commentImage ? 'Add a caption...' : 'Join the conversation...'}
            maxLength={2000}
            className="flex-1 px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 text-sm"
            style={{
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-lighter)',
                color: 'var(--text-primary)',
            }}
        />
        <button
            type="submit"
            disabled={(!newComment.trim() && !commentImage) || loading || uploadingComment}
            className="px-4 py-2.5 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ background: 'var(--brand-primary)' }}
        >
            <Send className="w-4 h-4" />
        </button>
    </div>
</form>
```

- [ ] **Step 7: Add image button + preview to inline reply input**

Find the `{replyingTo === comment.id && (` block. Replace the inner `<div className="flex gap-2">` input row with:

```tsx
{/* Reply image preview */}
{replyImagePreview && (
    <div className="relative inline-block mb-2">
        <img
            src={replyImagePreview}
            alt="Attachment preview"
            className="h-14 w-auto rounded-xl object-cover border"
            style={{ border: '1px solid var(--border-subtle)' }}
        />
        <button
            type="button"
            onClick={() => {
                URL.revokeObjectURL(replyImagePreview)
                setReplyImage(null)
                setReplyImagePreview(null)
            }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center"
        >
            <X className="w-3 h-3" />
        </button>
    </div>
)}
<div className="flex gap-2">
    <input
        ref={replyImageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setReplyImage(file)
            setReplyImagePreview(URL.createObjectURL(file))
            e.target.value = ''
        }}
    />
    <button
        type="button"
        onClick={() => replyImageRef.current?.click()}
        className="p-2 rounded-full flex-shrink-0 transition-colors hover:opacity-80"
        style={{ color: 'var(--text-muted)', background: 'var(--bg-lighter)' }}
        title="Attach image"
    >
        <ImageIcon className="w-4 h-4" />
    </button>
    <input
        type="text"
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder={replyImage ? 'Add a caption...' : `Reply to ${comment.username}...`}
        maxLength={2000}
        autoFocus
        onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleReplySubmit(comment.id)
            }
            if (e.key === 'Escape') {
                setReplyingTo(null)
            }
        }}
        className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 text-sm"
        style={{
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-lighter)',
            color: 'var(--text-primary)',
        }}
    />
    <button
        onClick={() => handleReplySubmit(comment.id)}
        disabled={(!replyText.trim() && !replyImage) || replyLoading || uploadingReply}
        className="px-3 py-2 text-white rounded-lg disabled:opacity-50 text-sm transition-colors"
        style={{ background: 'var(--brand-primary)' }}
    >
        <Send className="w-3.5 h-3.5" />
    </button>
    <button
        onClick={() => setReplyingTo(null)}
        className="px-3 py-2 rounded-lg text-sm transition-colors"
        style={{ color: 'var(--text-muted)', background: 'var(--bg-lighter)' }}
    >
        Cancel
    </button>
</div>
```

- [ ] **Step 8: Update all callers of onAddComment**

The `onAddComment` prop signature changed from `(body: string, parentId?: string)` to `(body: string, parentId?: string, imageUrl?: string)`. Find where `CommentSection` is used (in the community post detail page) and update the handler:

Find: `src/app/dashboard/community/[id]/page.tsx` (the community post detail page).

Locate the `onAddComment` handler passed to `<CommentSection>`. It will look something like:

```ts
async (body: string, parentId?: string) => {
    // ... API call
}
```

Update it to:

```ts
async (body: string, parentId?: string, imageUrl?: string) => {
    const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, parent_id: parentId, image_url: imageUrl }),
    })
    // rest of existing handler stays the same
}
```

Also add `postId={postId}` prop to the `<CommentSection>` component usage.

- [ ] **Step 9: Verify build**

```bash
npm run build
```
Expected: No TypeScript errors.

- [ ] **Step 10: Manual test**

1. Open a community post detail page
2. Click the image icon in the comment input → select an image
3. Verify: preview appears with ✕ button
4. Add optional caption, click Send
5. Verify: image appears below the comment text in the thread
6. Test reply: click Reply on a comment, attach image, send
7. Verify: image appears in the reply

- [ ] **Step 11: Commit**

```bash
git add src/components/community/CommentSection.tsx
git add src/app/dashboard/community
git commit -m "feat: add image attachment support to community post comments and replies"
```

---

## Final Verification

- [ ] **Run full build**

```bash
npm run build
```
Expected: Clean build, zero TypeScript errors.

- [ ] **Deploy to Vercel preview**

Push your branch and confirm the Vercel preview build passes before merging to main.

- [ ] **Smoke test checklist**
  - [ ] Boost a listing → image stays visible on marketplace
  - [ ] Open a conversation → no "user user" display names
  - [ ] Send a DM with image only → "📷 Image" shows in conversation list
  - [ ] Send a DM with image + caption → caption shows in conversation list
  - [ ] Attach image to a community comment → image renders in thread
  - [ ] Attach image to a reply → image renders nested in thread
