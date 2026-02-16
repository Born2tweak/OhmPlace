import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

// POST /api/community/comments/[id]/vote
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: commentId } = await params
    const { vote } = await request.json()

    if (![1, -1, 0].includes(vote)) {
        return NextResponse.json({ error: 'Vote must be 1, -1, or 0' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Get existing vote
    const { data: existing } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.userId)
        .maybeSingle() as { data: { id: string; vote: number } | null }

    const oldVote = existing?.vote || 0

    if (vote === 0) {
        if (existing) {
            await supabase.from('comment_votes').delete().eq('id', existing.id)
        }
    } else if (existing) {
        await supabase.from('comment_votes').update({ vote }).eq('id', existing.id)
    } else {
        await supabase.from('comment_votes').insert({
            comment_id: commentId,
            user_id: user.userId,
            vote
        })
    }

    // Update comment counters
    let upDelta = 0
    let downDelta = 0
    if (oldVote === 1) upDelta--
    if (oldVote === -1) downDelta--
    if (vote === 1) upDelta++
    if (vote === -1) downDelta++

    if (upDelta !== 0 || downDelta !== 0) {
        const { data: comment } = await supabase
            .from('comments')
            .select('upvotes, downvotes')
            .eq('id', commentId)
            .single() as { data: { upvotes: number; downvotes: number } | null }

        if (comment) {
            await supabase
                .from('comments')
                .update({
                    upvotes: Math.max(0, comment.upvotes + upDelta),
                    downvotes: Math.max(0, comment.downvotes + downDelta)
                })
                .eq('id', commentId)
        }
    }

    const { data: updated } = await supabase
        .from('comments')
        .select('upvotes, downvotes')
        .eq('id', commentId)
        .single() as { data: { upvotes: number; downvotes: number } | null }

    return NextResponse.json({
        upvotes: updated?.upvotes || 0,
        downvotes: updated?.downvotes || 0,
        userVote: vote
    })
}
