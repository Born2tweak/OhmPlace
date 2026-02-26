import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

// GET /api/community/posts?sort=new|best|hot
export async function GET(request: NextRequest) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'new'

    const supabase = getSupabase()

    let query = supabase
        .from('posts')
        .select('*')
        .eq('campus', user.campus)

    if (sort === 'new') {
        query = query.order('created_at', { ascending: false })
    } else if (sort === 'best') {
        query = query.order('upvotes', { ascending: false })
    }

    const { data: posts, error } = await query.limit(50) as {
        data: Record<string, unknown>[] | null
        error: { message: string } | null
    }

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
        return NextResponse.json([])
    }

    // Get user's votes on these posts
    const postIds = posts.map((p) => p.id as string)
    const { data: votes } = await supabase
        .from('post_votes')
        .select('post_id, vote')
        .eq('user_id', user.userId)
        .in('post_id', postIds) as { data: { post_id: string; vote: number }[] | null }

    const voteMap: Record<string, number> = {}
    votes?.forEach((v) => {
        voteMap[v.post_id] = v.vote
    })

    // Fetch avatars for all posts
    const userIds = Array.from(new Set(posts.map((p) => p.user_id as string)))
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds) as { data: { id: string; avatar_url: string | null }[] | null }

    const avatarMap: Record<string, string | null> = {}
    profiles?.forEach((p) => {
        avatarMap[p.id] = p.avatar_url
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any[] = posts.map((post) => ({
        ...post,
        userVote: voteMap[post.id as string] || 0,
        avatar_url: avatarMap[post.user_id as string] || null
    }))

    // Hot sort: score / (hours since post + 2)^1.5
    if (sort === 'hot') {
        const now = Date.now()
        result.sort((a, b) => {
            const scoreA = a.upvotes - a.downvotes
            const scoreB = b.upvotes - b.downvotes
            const hoursA = (now - new Date(a.created_at).getTime()) / 3600000
            const hoursB = (now - new Date(b.created_at).getTime()) / 3600000
            const hotA = scoreA / Math.pow(hoursA + 2, 1.5)
            const hotB = scoreB / Math.pow(hoursB + 2, 1.5)
            return hotB - hotA
        })
    }

    return NextResponse.json(result)
}

// POST /api/community/posts
export async function POST(request: NextRequest) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, body: postBody, flair } = body

    if (!title || title.length > 200) {
        return NextResponse.json({ error: 'Title is required (max 200 chars)' }, { status: 400 })
    }
    if (postBody && postBody.length > 5000) {
        return NextResponse.json({ error: 'Body too long (max 5000 chars)' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
        .from('posts')
        .insert({
            user_id: user.userId,
            username: user.username,
            campus: user.campus,
            title,
            body: postBody || null,
            flair: flair || null
        })
        .select()
        .single() as { data: Record<string, unknown> | null; error: { message: string } | null }

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}
