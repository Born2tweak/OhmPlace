import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

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
    const { body, parent_id } = await request.json()

    if (!body || body.length > 2000) {
        return NextResponse.json({ error: 'Comment is required (max 2000 chars)' }, { status: 400 })
    }

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
            body,
            parent_id: parent_id || null
        })
        .select()
        .single() as { data: Record<string, unknown> | null; error: { message: string } | null }

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Increment comment count
    await supabase
        .from('posts')
        .update({ comment_count: post.comment_count + 1 })
        .eq('id', postId)

    return NextResponse.json({ ...comment, userVote: 0 }, { status: 201 })
}
