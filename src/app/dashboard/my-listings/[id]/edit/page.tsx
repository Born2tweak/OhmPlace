'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import ImageUploader from '@/components/ImageUploader'
import { uploadListingImage, deleteListingImage } from '@/lib/supabase/storage'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, CONDITIONS } from '@/types/database'
import type { Listing, ListingUpdate, ListingImage, ListingImageInsert } from '@/types/database'

export default function EditListingPage() {
    const router = useRouter()
    const params = useParams()
    const { user } = useUser()
    const listingId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        condition: '' as 'new' | 'used-good' | 'used-fair' | '',
        price: '',
        status: 'available' as 'available' | 'sold' | 'reserved'
    })
    const [existingImages, setExistingImages] = useState<ListingImage[]>([])
    const [newImages, setNewImages] = useState<File[]>([])
    const [removedImageIds, setRemovedImageIds] = useState<string[]>([])

    useEffect(() => {
        if (user?.id && listingId) {
            fetchListing()
        }
    }, [user?.id, listingId])

    const fetchListing = async () => {
        const supabase = createClient()

        // Fetch listing
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .eq('user_id', user!.id)
            .single()

        if (listingError || !listing) {
            setError('Listing not found or you do not have permission to edit it')
            setLoading(false)
            return
        }

        // Fetch images
        const { data: images } = await supabase
            .from('listing_images')
            .select('*')
            .eq('listing_id', listingId)
            .order('order', { ascending: true })

        setFormData({
            title: listing.title,
            description: listing.description || '',
            category: listing.category,
            condition: listing.condition,
            price: (listing.price / 100).toFixed(2),
            status: listing.status
        })
        setExistingImages(images || [])
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        const totalImages = existingImages.length - removedImageIds.length + newImages.length
        if (totalImages === 0) {
            setError('At least one image is required')
            return
        }

        setSaving(true)

        try {
            const supabase = createClient()

            // Update listing
            const priceInCents = Math.round(parseFloat(formData.price) * 100)
            const updateData: ListingUpdate = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                category: formData.category,
                condition: formData.condition || undefined,
                price: priceInCents,
                status: formData.status
            }

            const { error: updateError } = await supabase
                .from('listings')
                .update(updateData)
                .eq('id', listingId)

            if (updateError) throw new Error('Failed to update listing')

            // Remove deleted images
            for (const imageId of removedImageIds) {
                const image = existingImages.find((img) => img.id === imageId)
                if (image) {
                    await deleteListingImage(image.image_url)
                    await supabase.from('listing_images').delete().eq('id', imageId)
                }
            }

            // Upload new images
            const newImageUrls: string[] = []
            for (const file of newImages) {
                const url = await uploadListingImage(file, listingId)
                newImageUrls.push(url)
            }

            // Insert new image records
            if (newImageUrls.length > 0) {
                const maxOrder = Math.max(...existingImages.map((img) => img.order), -1)
                const imageRecords: ListingImageInsert[] = newImageUrls.map((url, index) => ({
                    listing_id: listingId,
                    image_url: url,
                    order: maxOrder + index + 1
                }))

                await supabase.from('listing_images').insert(imageRecords)
            }

            // Success!
            router.push('/dashboard/my-listings')
        } catch (err) {
            console.error('Save error:', err)
            setError(err instanceof Error ? err.message : 'Failed to update listing')
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-[#5a6c7d]">Loading listing...</p>
            </div>
        )
    }

    if (error && !formData.title) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-red-600">{error}</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-[#2c3e50] mb-6">Edit Listing</h1>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Same form fields as new listing */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-[#2c3e50] mb-2">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        maxLength={100}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-[#d4e8ea] rounded-lg focus:outline-none focus:border-[#22c1c3] text-[#2c3e50]"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-[#2c3e50] mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        maxLength={500}
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-[#d4e8ea] rounded-lg focus:outline-none focus:border-[#22c1c3] text-[#2c3e50]"
                    />
                </div>

                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-[#2c3e50] mb-2">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-[#d4e8ea] rounded-lg focus:outline-none focus:border-[#22c1c3] text-[#2c3e50]"
                    >
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                        Condition <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                        {CONDITIONS.map((cond) => (
                            <label key={cond.value} className="flex items-center">
                                <input
                                    type="radio"
                                    value={cond.value}
                                    checked={formData.condition === cond.value}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                                    className="mr-3 text-[#22c1c3] focus:ring-[#22c1c3]"
                                />
                                <span className="text-[#2c3e50]">{cond.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-[#2c3e50] mb-2">
                        Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 text-[#5a6c7d]">$</span>
                        <input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full pl-8 pr-4 py-2 border border-[#d4e8ea] rounded-lg focus:outline-none focus:border-[#22c1c3] text-[#2c3e50]"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-[#2c3e50] mb-2">
                        Status
                    </label>
                    <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-2 border border-[#d4e8ea] rounded-lg focus:outline-none focus:border-[#22c1c3] text-[#2c3e50]"
                    >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                        Images <span className="text-red-500">*</span>
                    </label>
                    <ImageUploader
                        maxImages={5}
                        onImagesChange={setNewImages}
                        existingImages={existingImages.filter((img) => !removedImageIds.includes(img.id)).map((img) => img.image_url)}
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-[#22c1c3] text-white py-3 rounded-lg font-medium hover:bg-[#1a9a9b] disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={saving}
                        className="px-6 py-3 border border-[#d4e8ea] rounded-lg font-medium text-[#5a6c7d] hover:bg-[#f4fafb] disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
