import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'

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

        // Enrich with profile data
        const userIds = new Set<string>()
        data.forEach((c: any) => {
            userIds.add(c.participant_1)
            userIds.add(c.participant_2)
        })

        const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', Array.from(userIds))

        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]))

        const enriched = data.map((c: any) => {
            const otherUserId = c.participant_1 === authUser.userId ? c.participant_2 : c.participant_1
            const profile = profileMap.get(otherUserId) as any
            return {
                ...c,
                other_user: {
                    id: otherUserId,
                    email: profile?.email || 'user@campus.edu',
                    full_name: profile?.full_name || undefined,
                    avatar_url: profile?.avatar_url || undefined,
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
        // Check for existing conversation (bidirectional)
        const { data: existing, error: fetchError } = await supabase
            .from('conversations')
            .select('id')
            .or(
                `and(participant_1.eq.${authUser.userId},participant_2.eq.${participantId}),and(participant_1.eq.${participantId},participant_2.eq.${authUser.userId})`
            )
            .maybeSingle()

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error finding conversation:', fetchError)
            return NextResponse.json({ error: 'Failed to find conversation' }, { status: 500 })
        }

        if (existing) {
            return NextResponse.json({ conversationId: existing.id })
        }

        // Create new conversation
        const { data: newConvo, error: createError } = await supabase
            .from('conversations')
            .insert({
                participant_1: authUser.userId,
                participant_2: participantId,
                last_message_at: new Date().toISOString(),
            })
            .select('id')
            .single()

        if (createError) {
            console.error('Error creating conversation:', createError)
            return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
        }

        return NextResponse.json({ conversationId: newConvo.id })
    } catch (error) {
        console.error('Conversation API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
