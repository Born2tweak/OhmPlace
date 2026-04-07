import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'
import { SUPPORTED_CAMPUSES } from '@/lib/campus'

export async function PATCH(request: NextRequest) {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { campus?: string }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { campus } = body
    if (!campus || !SUPPORTED_CAMPUSES.includes(campus)) {
        return NextResponse.json({ error: 'Invalid campus' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { error } = await supabase
        .from('profiles')
        .update({ campus, updated_at: new Date().toISOString() })
        .eq('id', authUser.userId)

    if (error) {
        console.error('set-campus error:', error)
        return NextResponse.json({ error: 'Failed to update campus' }, { status: 500 })
    }

    return NextResponse.json({ campus })
}
