import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'
import type { Conversation, Profile } from '@/types/database'

type ConversationWithUser = Conversation & {
    other_user: {
        id: string
        email: string
        full_name?: string
        avatar_url?: string
    }
}

type ClerkUserSummary = {
    id: string
    full_name: string | null
    email: string
    clerk_avatar: string | null
}

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

        if (error || !data) {
            console.error('Error fetching conversations:', error)
            return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
        }

        const otherUserIds = [...new Set(
            data.map((conversation) =>
                conversation.participant_1 === authUser.userId ? conversation.participant_2 : conversation.participant_1
            )
        )]

        const client = await clerkClient()
        const [clerkUsers, profilesResult] = await Promise.all([
            Promise.all(
                otherUserIds.map(async (id): Promise<ClerkUserSummary> => {
                    try {
                        const user = await client.users.getUser(id)
                        return {
                            id,
                            full_name: user.fullName || user.firstName || user.username || 'Unknown User',
                            email: user.primaryEmailAddress?.emailAddress || '',
                            clerk_avatar: user.imageUrl,
                        }
                    } catch {
                        return { id, full_name: null, email: '', clerk_avatar: null }
                    }
                })
            ),
            supabase.from('profiles').select('id, full_name, avatar_url, email').in('id', otherUserIds),
        ])

        const clerkMap = new Map<string, ClerkUserSummary>(clerkUsers.map((user) => [user.id, user]))
        const profileMap = new Map<string, Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'email'>>(
            (profilesResult.data || []).map((profile) => [profile.id, profile])
        )

        const enriched: ConversationWithUser[] = data.map((conversation) => {
            const otherUserId = conversation.participant_1 === authUser.userId ? conversation.participant_2 : conversation.participant_1
            const clerk = clerkMap.get(otherUserId)
            const profile = profileMap.get(otherUserId)

            return {
                ...conversation,
                other_user: {
                    id: otherUserId,
                    email: clerk?.email || profile?.email || '',
                    full_name: profile?.full_name || clerk?.full_name || 'Unknown User',
                    avatar_url: profile?.avatar_url || clerk?.clerk_avatar || undefined,
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
