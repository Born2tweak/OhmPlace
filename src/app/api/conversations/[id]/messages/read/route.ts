import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'

export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    const supabase = getSupabase()

    // Validate participant
    const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .select('id, participant_1, participant_2')
        .eq('id', conversationId)
        .single()

    if (convoError || !convo) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (convo.participant_1 !== authUser.userId && convo.participant_2 !== authUser.userId) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    try {
        const { error } = await supabase
            .from('messages')
            .update({ status: 'read' })
            .eq('conversation_id', conversationId)
            .neq('sender_id', authUser.userId)
            .neq('status', 'read')

        if (error) {
            console.error('Error marking messages as read:', error)
            return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Messages read PATCH error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
