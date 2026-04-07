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
