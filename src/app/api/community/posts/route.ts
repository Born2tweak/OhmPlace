import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

const VALID_FLAIRS = ['question', 'discussion', 'selling', 'buying', 'event', 'meme', 'advice', 'rant'] as const

const CreatePostSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long (max 200 chars)'),
    body: z.string().max(5000, 'Body too long (max 5000 chars)').optional().nullable(),
    flair: z.enum(VALID_FLAIRS).optional().nullable(),
    image_url: z.string().url().max(2000).optional().nullable(),
})

const SortSchema = z.enum(['new', 'best', 'hot']).default('new')

// GET /api/community/posts?sort=new|best|hot
export async function GET(request: NextRequest) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sort = SortSchema.parse(searchParams.get('sort') || 'new')

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
        console.error('Failed to fetch posts:', error)
        return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 })
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

    const result: Record<string, unknown>[] = posts.map((post) => ({
        ...post,
        userVote: voteMap[post.id as string] || 0,
        avatar_url: avatarMap[post.user_id as string] || null
    }))

    // Hot sort: score / (hours since post + 2)^1.5
    if (sort === 'hot') {
        const now = Date.now()
        result.sort((a, b) => {
            const scoreA = (a.upvotes as number) - (a.downvotes as number)
            const scoreB = (b.upvotes as number) - (b.downvotes as number)
            const hoursA = (now - new Date(a.created_at as string).getTime()) / 3600000
            const hoursB = (now - new Date(b.created_at as string).getTime()) / 3600000
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

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const parsed = CreatePostSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || 'Invalid input' },
            { status: 400 }
        )
    }

    const { title, body: postBody, flair, image_url } = parsed.data
    const supabase = getSupabase()

    const { data, error } = await supabase
        .from('posts')
        .insert({
            user_id: user.userId,
            username: user.username,
            campus: user.campus,
            title,
            body: postBody || null,
            flair: flair || null,
            image_url: image_url || null
        })
        .select()
        .single() as { data: Record<string, unknown> | null; error: { message: string } | null }

    if (error) {
        console.error('Failed to create post:', error)
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}
