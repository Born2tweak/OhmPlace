import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

// POST /api/community/posts/[id]/vote
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await params
    const { vote } = await request.json()

    if (![1, -1, 0].includes(vote)) {
        return NextResponse.json({ error: 'Vote must be 1, -1, or 0' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Get existing vote
    const { data: existing } = await supabase
        .from('post_votes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.userId)
        .maybeSingle() as { data: { id: string; vote: number } | null }

    const oldVote = existing?.vote || 0

    if (vote === 0) {
        // Remove vote
        if (existing) {
            await supabase.from('post_votes').delete().eq('id', existing.id)
        }
    } else if (existing) {
        // Update vote
        await supabase.from('post_votes').update({ vote }).eq('id', existing.id)
    } else {
        // Insert vote
        await supabase.from('post_votes').insert({
            post_id: postId,
            user_id: user.userId,
            vote
        })
    }

    // Update post counters
    let upDelta = 0
    let downDelta = 0

    // Remove old vote effect
    if (oldVote === 1) upDelta--
    if (oldVote === -1) downDelta--

    // Apply new vote effect
    if (vote === 1) upDelta++
    if (vote === -1) downDelta++

    if (upDelta !== 0 || downDelta !== 0) {
        // Fetch current counts and update
        const { data: post } = await supabase
            .from('posts')
            .select('upvotes, downvotes')
            .eq('id', postId)
            .single() as { data: { upvotes: number; downvotes: number } | null }

        if (post) {
            await supabase
                .from('posts')
                .update({
                    upvotes: Math.max(0, post.upvotes + upDelta),
                    downvotes: Math.max(0, post.downvotes + downDelta)
                })
                .eq('id', postId)
        }
    }

    // Return updated post
    const { data: updated } = await supabase
        .from('posts')
        .select('upvotes, downvotes')
        .eq('id', postId)
        .single() as { data: { upvotes: number; downvotes: number } | null }

    return NextResponse.json({
        upvotes: updated?.upvotes || 0,
        downvotes: updated?.downvotes || 0,
        userVote: vote
    })
}
