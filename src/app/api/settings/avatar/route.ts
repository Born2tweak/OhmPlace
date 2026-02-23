import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        console.log('[avatar] Starting upload...')

        const user = await getAuthenticatedUser()
        if (!user) {
            console.log('[avatar] No authenticated user')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.log('[avatar] User:', user.userId)

        const formData = await req.formData()
        const file = formData.get('avatar')
        console.log('[avatar] File received:', file ? 'yes' : 'no', 'type:', typeof file, 'instanceof Blob:', file instanceof Blob)

        if (!file || !(file instanceof Blob)) {
            console.log('[avatar] Invalid file object')
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)
        console.log('[avatar] Buffer size:', buffer.length, 'bytes')

        if (buffer.length > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
        }

        const contentType = (file as File).type || 'image/webp'
        const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'webp'
        const filePath = `${user.userId}.${ext}`
        console.log('[avatar] Uploading as:', filePath, 'contentType:', contentType)

        const supabase = getSupabase()

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, buffer, {
                contentType,
                upsert: true,
            })

        if (uploadError) {
            console.error('[avatar] Upload error:', JSON.stringify(uploadError))
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }
        console.log('[avatar] Upload success:', JSON.stringify(uploadData))

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        const avatar_url = `${urlData.publicUrl}?v=${Date.now()}`
        console.log('[avatar] Public URL:', avatar_url)

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: user.userId,
                email: user.email,
                avatar_url,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })

        if (updateError) {
            console.error('[avatar] Profile update error:', JSON.stringify(updateError))
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
        console.log('[avatar] Profile updated successfully')

        return NextResponse.json({ avatar_url })
    } catch (err) {
        console.error('[avatar] Unhandled error:', err)
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
