import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('avatar')

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        // Validate file size
        if (buffer.length > MAX_AVATAR_SIZE) {
            return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
        }

        // Validate content type
        const contentType = (file as File).type || 'image/webp'
        if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 })
        }

        const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'webp'
        const filePath = `${user.userId}.${ext}`

        const supabase = getSupabase()

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, buffer, {
                contentType,
                upsert: true,
            })

        if (uploadError) {
            console.error('[avatar] Upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        const avatar_url = `${urlData.publicUrl}?v=${Date.now()}`

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: user.userId,
                email: user.email,
                avatar_url,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })

        if (updateError) {
            console.error('[avatar] Profile update error:', updateError)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        return NextResponse.json({ avatar_url })
    } catch (err) {
        console.error('[avatar] Unhandled error:', err)
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
    }
}
