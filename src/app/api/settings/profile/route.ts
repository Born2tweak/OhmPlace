import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'

export async function GET() {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabase()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.userId)
        .single()

    if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        id: user.userId,
        email: user.email,
        username: data?.full_name || user.username,
        campus: user.campus,
        bio: data?.bio || '',
        major: data?.major || '',
        year: data?.year || '',
        avatar_url: data?.avatar_url || '',
    })
}

export async function PATCH(req: NextRequest) {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const supabase = getSupabase()

    // Build update object — only include columns that exist
    // full_name maps to username; bio/major/year are new columns (may not exist yet)
    const updates: Record<string, string> = {
        full_name: body.username ?? user.username,
        updated_at: new Date().toISOString(),
    }

    // Only add extended fields if they were provided (will silently fail if cols missing)
    if (body.bio !== undefined) updates.bio = body.bio
    if (body.major !== undefined) updates.major = body.major
    if (body.year !== undefined) updates.year = body.year

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: user.userId,
            email: user.email,
            ...updates,
        }, { onConflict: 'id' })
        .select()
        .single()

    if (error) {
        // If error is about missing columns (bio/major/year), retry without them
        if (error.message?.includes('column') || error.code === '42703') {
            const fallback = await supabase
                .from('profiles')
                .upsert({
                    id: user.userId,
                    email: user.email,
                    full_name: updates.full_name,
                    updated_at: updates.updated_at,
                }, { onConflict: 'id' })
                .select()
                .single()

            if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 })
            return NextResponse.json({ ...fallback.data, needs_migration: true })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
