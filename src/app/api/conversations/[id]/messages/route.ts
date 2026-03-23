import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'
import type { Conversation } from '@/types/database'

type ConversationLookup = Pick<Conversation, 'id' | 'participant_1' | 'participant_2'>

async function validateParticipant(
    supabase: ReturnType<typeof getSupabase>,
    conversationId: string,
    userId: string
): Promise<ConversationLookup | null> {
    const { data, error } = await supabase
        .from('conversations')
        .select('id, participant_1, participant_2')
        .eq('id', conversationId)
        .single()

    if (error || !data) return null
    if (data.participant_1 !== userId && data.participant_2 !== userId) return null
    return data
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    const supabase = getSupabase()

    const convo = await validateParticipant(supabase, conversationId, authUser.userId)
    if (!convo) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching messages:', error)
            return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Messages GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    const supabase = getSupabase()

    const convo = await validateParticipant(supabase, conversationId, authUser.userId)
    if (!convo) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    let body: { text?: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { text } = body
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json({ error: 'Message text is required' }, { status: 400 })
    }

    if (text.length > 2000) {
        return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
    }

    try {
        const { data: message, error: insertError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: authUser.userId,
                text: text.trim(),
                status: 'sent',
            })
            .select('*')
            .single()

        if (insertError) {
            console.error('Error sending message:', insertError)
            return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
        }

        // Update conversation's last message
        await supabase
            .from('conversations')
            .update({
                last_message_text: text.trim(),
                last_message_at: new Date().toISOString(),
            })
            .eq('id', conversationId)

        return NextResponse.json(message)
    } catch (error) {
        console.error('Messages POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
