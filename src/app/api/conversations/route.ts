import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET() {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()

    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .or(`participant_1.eq.${authUser.userId},participant_2.eq.${authUser.userId}`)
            .order('last_message_at', { ascending: false })

        if (error) {
            console.error('Error fetching conversations:', error)
            return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
        }

        // Collect all OTHER participant IDs (not the current user)
        const otherUserIds = [...new Set(
            data.map((c: any) =>
                c.participant_1 === authUser.userId ? c.participant_2 : c.participant_1
            )
        )] as string[]

        // Fetch Clerk user data + profile avatar overrides in parallel
        const [clerkUsers, profilesResult] = await Promise.all([
            // Fetch from Clerk (authoritative source for name/email/avatar)
            Promise.all(
                otherUserIds.map(async (id) => {
                    try {
                        const client = await clerkClient()
                        const u = await client.users.getUser(id)
                        return {
                            id,
                            full_name: u.fullName || u.firstName || u.username || 'Unknown User',
                            email: u.primaryEmailAddress?.emailAddress || '',
                            clerk_avatar: u.imageUrl,
                        }
                    } catch {
                        return { id, full_name: null, email: '', clerk_avatar: null }
                    }
                })
            ),
            // Fetch profiles for custom avatar overrides
            supabase.from('profiles').select('id, full_name, avatar_url').in('id', otherUserIds),
        ])

        const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]))
        const profileMap = new Map(profilesResult.data?.map((p: any) => [p.id, p]))

        const enriched = data.map((c: any) => {
            const otherUserId = c.participant_1 === authUser.userId ? c.participant_2 : c.participant_1
            const clerk = clerkMap.get(otherUserId)
            const profile = profileMap.get(otherUserId) as any

            // Profile full_name overrides Clerk if explicitly set; profile avatar_url overrides Clerk avatar if set
            const full_name = profile?.full_name || clerk?.full_name || 'Unknown User'
            const avatar_url = profile?.avatar_url || clerk?.clerk_avatar || undefined

            return {
                ...c,
                other_user: {
                    id: otherUserId,
                    email: clerk?.email || profile?.email || '',
                    full_name,
                    avatar_url,
                }
            }
        })

        return NextResponse.json(enriched)
    } catch (error) {
        console.error('Conversations GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { participantId?: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { participantId } = body
    if (!participantId || typeof participantId !== 'string') {
        return NextResponse.json({ error: 'participantId is required' }, { status: 400 })
    }

    if (participantId === authUser.userId) {
        return NextResponse.json({ error: "You can't message yourself" }, { status: 400 })
    }

    const supabase = getSupabase()

    try {
        // Check for existing conversation (bidirectional) — use limit(1) not maybeSingle()
        // because maybeSingle() errors when >1 row exists (e.g. both A→B and B→A rows)
        const { data: existingRows, error: fetchError } = await supabase
            .from('conversations')
            .select('id')
            .or(
                `and(participant_1.eq.${authUser.userId},participant_2.eq.${participantId}),and(participant_1.eq.${participantId},participant_2.eq.${authUser.userId})`
            )
            .limit(1)

        if (fetchError) {
            console.error('Error finding conversation:', fetchError)
            return NextResponse.json({ error: 'Failed to find conversation' }, { status: 500 })
        }

        if (existingRows && existingRows.length > 0) {
            return NextResponse.json({ conversationId: existingRows[0].id })
        }

        // Create new conversation — canonicalize order so (A,B) and (B,A) always produce the same row
        const [p1, p2] = [authUser.userId, participantId].sort()
        const { data: newConvo, error: createError } = await supabase
            .from('conversations')
            .insert({
                participant_1: p1,
                participant_2: p2,
                last_message_at: new Date().toISOString(),
            })
            .select('id')
            .single()

        if (createError) {
            // Handle race condition: another request may have just created the same conversation
            if (createError.code === '23505') {
                const { data: racedConvo } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(
                        `and(participant_1.eq.${authUser.userId},participant_2.eq.${participantId}),and(participant_1.eq.${participantId},participant_2.eq.${authUser.userId})`
                    )
                    .limit(1)
                if (racedConvo && racedConvo.length > 0) {
                    return NextResponse.json({ conversationId: racedConvo[0].id })
                }
            }
            console.error('Error creating conversation:', createError)
            return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
        }

        return NextResponse.json({ conversationId: newConvo.id })
    } catch (error) {
        console.error('Conversation API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
