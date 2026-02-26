import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

// GET /api/community/posts/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabase()

    // Get the post
    const { data: post, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single() as { data: Record<string, unknown> | null; error: unknown }

    if (postError || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get comments (including parent_id for threading)
    const { data: comments } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true }) as { data: Record<string, unknown>[] | null }

    // Get user's vote on the post
    const { data: postVote } = await supabase
        .from('post_votes')
        .select('vote')
        .eq('post_id', id)
        .eq('user_id', user.userId)
        .maybeSingle() as { data: { vote: number } | null }

    // Get user's votes on comments
    const commentIds = (comments || []).map((c) => c.id as string)
    const commentVoteMap: Record<string, number> = {}

    if (commentIds.length > 0) {
        const { data: commentVotes } = await supabase
            .from('comment_votes')
            .select('comment_id, vote')
            .eq('user_id', user.userId)
            .in('comment_id', commentIds) as { data: { comment_id: string; vote: number }[] | null }

        commentVotes?.forEach((v) => {
            commentVoteMap[v.comment_id] = v.vote
        })
    }
    // Fetch avatars for post and all comments
    const userIds = Array.from(new Set([
        post.user_id as string,
        ...(comments || []).map(c => c.user_id as string)
    ]))

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds) as { data: { id: string; avatar_url: string | null }[] | null }

    const avatarMap: Record<string, string | null> = {}
    profiles?.forEach((p) => {
        avatarMap[p.id] = p.avatar_url
    })

    return NextResponse.json({
        ...post,
        userVote: postVote?.vote || 0,
        avatar_url: avatarMap[post.user_id as string] || null,
        comments: (comments || []).map((c) => ({
            ...c,
            userVote: commentVoteMap[c.id as string] || 0,
            avatar_url: avatarMap[c.user_id as string] || null
        }))
    })
}

// DELETE /api/community/posts/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabase()

    // Verify ownership
    const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', id)
        .single() as { data: { user_id: string } | null }

    if (!post || post.user_id !== user.userId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { error } = await supabase.from('posts').delete().eq('id', id)

    if (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
