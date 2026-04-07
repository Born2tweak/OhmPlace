import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
]

export async function POST(request: NextRequest) {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string | null

    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!conversationId) {
        return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Verify user is a participant in this conversation
    const supabase = getSupabase()
    const { data: convo } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .or(`participant_1.eq.${authUser.userId},participant_2.eq.${authUser.userId}`)
        .single()

    if (!convo) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${conversationId}/${authUser.userId}-${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data, error } = await supabase.storage
        .from('message-images')
        .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        console.error('Storage upload error:', error)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
}
