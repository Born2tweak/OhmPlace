import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { detectCampusFromEmail } from '@/lib/campus'

// GET /api/community/campuses — distinct campuses that have posts
export async function GET() {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
        .from('posts')
        .select('campus')
        .not('campus', 'is', null) as { data: { campus: string }[] | null; error: { message: string } | null }

    if (error) {
        return NextResponse.json({ error: 'Failed to load campuses' }, { status: 500 })
    }

    // Normalize: old posts may have stored email domains — map them to full names
    const campuses = Array.from(
        new Set(
            (data ?? []).map(r => {
                // If it looks like a domain (no spaces, has a dot), try to resolve it
                const val = r.campus
                if (!val.includes(' ') && val.includes('.')) {
                    return detectCampusFromEmail(`x@${val}`) ?? val
                }
                return val
            })
        )
    ).sort()

    return NextResponse.json(campuses)
}
