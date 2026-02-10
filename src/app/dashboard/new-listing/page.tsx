'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import ImageUploader from '@/components/ImageUploader'
import { uploadListingImage } from '@/lib/supabase/storage'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, CONDITIONS } from '@/types/database'
import type { ListingInsert, ListingImageInsert } from '@/types/database'

export default function NewListingPage() {
    const router = useRouter()
    const { user } = useUser()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        condition: '' as 'new' | 'used-good' | 'used-fair' | '',
        price: ''
    })
    const [images, setImages] = useState<File[]>([])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!formData.title.trim()) {
            setError('Title is required')
            return
        }
        if (!formData.category) {
            setError('Category is required')
            return
        }
        if (!formData.condition) {
            setError('Condition is required')
            return
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            setError('Valid price is required')
            return
        }
        if (images.length === 0) {
            setError('At least one image is required')
            return
        }

        if (!user?.id) {
            setError('You must be logged in to create a listing')
            return
        }

        setLoading(true)

        try {
            const supabase = createClient()

            // Convert price to cents
            const priceInCents = Math.round(parseFloat(formData.price) * 100)

            // Create listing first to get ID
            const listingData: ListingInsert = {
                user_id: user.id,
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                category: formData.category,
                condition: formData.condition,
                price: priceInCents
            }

            const { data: listing, error: listingError } = await supabase
                .from('listings')
                .insert(listingData)
                .select()
                .single()

            if (listingError) {
                console.error('Listing error:', listingError)
                throw new Error('Failed to create listing')
            }

            // Upload images
            const imageUrls: string[] = []
            for (const file of images) {
                const url = await uploadListingImage(file, listing.id)
                imageUrls.push(url)
            }

            // Insert image records
            const imageRecords: ListingImageInsert[] = imageUrls.map((url, index) => ({
                listing_id: listing.id,
                image_url: url,
                order: index
            }))

            const { error: imagesError } = await supabase
                .from('listing_images')
                .insert(imageRecords)

            if (imagesError) {
                console.error('Images error:', imagesError)
                throw new Error('Failed to save image records')
            }

            // Success! Redirect to My Listings
            router.push('/dashboard/my-listings')
        } catch (err) {
            console.error('Submit error:', err)
            setError(err instanceof Error ? err.message : 'Failed to create listing')
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-[#2c3e50] mb-6">Create New Listing</h1>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
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
                        placeholder="e.g., Arduino Uno R3 - Brand New"
                    />
                    <p className="mt-1 text-sm text-[#95a5a6]">
                        {formData.title.length}/100 characters
                    </p>
                </div>

                {/* Description */}
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
                        placeholder="Describe your item, any defects, etc."
                    />
                    <p className="mt-1 text-sm text-[#95a5a6]">
                        {formData.description.length}/500 characters
                    </p>
                </div>

                {/* Category */}
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
                        <option value="">Select a category</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Condition */}
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

                {/* Price */}
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
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Images */}
                <div>
                    <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                        Images <span className="text-red-500">*</span>
                    </label>
                    <ImageUploader
                        maxImages={5}
                        onImagesChange={setImages}
                    />
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-[#22c1c3] text-white py-3 rounded-lg font-medium hover:bg-[#1a9a9b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create Listing'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={loading}
                        className="px-6 py-3 border border-[#d4e8ea] rounded-lg font-medium text-[#5a6c7d] hover:bg-[#f4fafb] disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
