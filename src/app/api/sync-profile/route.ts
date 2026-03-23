import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST() {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()

    try {
        // Get the full Clerk user for name/avatar
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(authUser.userId)

        const full_name = clerkUser.fullName ||
            [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
            authUser.username ||
            authUser.email.split('@')[0]

        // Check if they have a custom avatar already uploaded
        const { data: existing } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', authUser.userId)
            .maybeSingle()

        // Only use Clerk avatar if no custom one has been uploaded
        const avatar_url = existing?.avatar_url || clerkUser.imageUrl

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: authUser.userId,
                email: authUser.email,
                full_name,
                avatar_url,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
            .select('id, full_name, avatar_url')
            .single()

        if (error) {
            console.error('sync-profile upsert error:', error)
            return NextResponse.json({ error: 'Failed to sync profile' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('sync-profile error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
