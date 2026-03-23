import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const q = request.nextUrl.searchParams.get('q')
    if (!q || q.trim().length < 1) {
        return NextResponse.json([])
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${q.trim()}%`)
        .neq('id', authUser.userId)
        .limit(20)

    if (error) {
        console.error('User search error:', error)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    return NextResponse.json(data || [])
}
