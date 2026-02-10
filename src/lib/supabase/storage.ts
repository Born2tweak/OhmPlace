import { createClient } from '@/lib/supabase/client'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function uploadListingImage(
    file: File,
    listingId: string
): Promise<string> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 5MB')
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed')
    }

    const supabase = createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${listingId}/${crypto.randomUUID()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error('Upload error:', error)
        throw new Error('Failed to upload image')
    }

    // Get public URL
    const {
        data: { publicUrl }
    } = supabase.storage.from('listing-images').getPublicUrl(data.path)

    return publicUrl
}

export async function deleteListingImage(imageUrl: string): Promise<void> {
    const supabase = createClient()

    // Extract path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/listing-images/')
    if (pathParts.length < 2) {
        throw new Error('Invalid image URL')
    }
    const filePath = pathParts[1]

    const { error } = await supabase.storage
        .from('listing-images')
        .remove([filePath])

    if (error) {
        console.error('Delete error:', error)
        throw new Error('Failed to delete image')
    }
}

export async function deleteAllListingImages(listingId: string): Promise<void> {
    const supabase = createClient()

    // List all files for this listing
    const { data: files, error: listError } = await supabase.storage
        .from('listing-images')
        .list(listingId)

    if (listError) {
        console.error('List error:', listError)
        throw new Error('Failed to list images')
    }

    if (!files || files.length === 0) {
        return
    }

    // Delete all files
    const filePaths = files.map((file) => `${listingId}/${file.name}`)
    const { error: deleteError } = await supabase.storage
        .from('listing-images')
        .remove(filePaths)

    if (deleteError) {
        console.error('Delete error:', deleteError)
        throw new Error('Failed to delete images')
    }
}
