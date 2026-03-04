import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'

const UpdateProfileSchema = z.object({
    username: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    major: z.string().max(100).optional(),
    year: z.string().max(20).optional(),
})

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
        console.error('Failed to fetch profile:', error)
        return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
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

    let rawBody: unknown
    try {
        rawBody = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const parsed = UpdateProfileSchema.safeParse(rawBody)
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || 'Invalid input' },
            { status: 400 }
        )
    }

    const body = parsed.data
    const supabase = getSupabase()

    // Build update object — only include columns that exist
    const updates: Record<string, string> = {
        full_name: body.username ?? user.username,
        updated_at: new Date().toISOString(),
    }

    // Only add extended fields if they were provided
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

            if (fallback.error) {
                console.error('Failed to update profile (fallback):', fallback.error)
                return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
            }
            return NextResponse.json({ ...fallback.data, needs_migration: true })
        }
        console.error('Failed to update profile:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(data)
}
