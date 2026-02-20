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

        if (!formData.title.trim()) { setError('Title is required'); return }
        if (!formData.category) { setError('Category is required'); return }
        if (!formData.condition) { setError('Condition is required'); return }
        if (!formData.price || parseFloat(formData.price) <= 0) { setError('Valid price is required'); return }
        if (images.length === 0) { setError('At least one image is required'); return }
        if (!user?.id) { setError('You must be logged in to create a listing'); return }

        setLoading(true)

        try {
            const supabase = createClient()
            const priceInCents = Math.round(parseFloat(formData.price) * 100)

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

            if (listingError) { throw new Error('Failed to create listing') }

            const imageUrls: string[] = []
            for (const file of images) {
                const url = await uploadListingImage(file, listing.id)
                imageUrls.push(url)
            }

            const imageRecords: ListingImageInsert[] = imageUrls.map((url, index) => ({
                listing_id: listing.id,
                image_url: url,
                order: index
            }))

            const { error: imagesError } = await supabase
                .from('listing_images')
                .insert(imageRecords)

            if (imagesError) { throw new Error('Failed to save image records') }

            router.push('/dashboard/my-listings')
        } catch (err) {
            console.error('Submit error:', err)
            setError(err instanceof Error ? err.message : 'Failed to create listing')
            setLoading(false)
        }
    }

    return (
        <div className="rounded-lg shadow-md p-8" style={{ background: 'var(--bg-card)' }}>
            <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Create New Listing</h1>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        maxLength={100}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-lighter)', color: 'var(--text-primary)' }}
                        placeholder="e.g., Arduino Uno R3 - Brand New"
                    />
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formData.title.length}/100 characters
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Description
                    </label>
                    <textarea
                        id="description"
                        maxLength={500}
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-lighter)', color: 'var(--text-primary)' }}
                        placeholder="Describe your item, any defects, etc."
                    />
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formData.description.length}/500 characters
                    </p>
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-lighter)', color: 'var(--text-primary)' }}
                    >
                        <option value="">Select a category</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Condition */}
                <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
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
                                    className="mr-3"
                                    style={{ accentColor: 'var(--brand-primary)' }}
                                />
                                <span style={{ color: 'var(--text-primary)' }}>{cond.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Price */}
                <div>
                    <label htmlFor="price" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5" style={{ color: 'var(--text-secondary)' }}>$</span>
                        <input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full pl-8 pr-4 py-2 rounded-lg focus:outline-none"
                            style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-lighter)', color: 'var(--text-primary)' }}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Images */}
                <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
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
                        className="flex-1 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ background: 'var(--brand-primary)' }}
                    >
                        {loading ? 'Creating...' : 'Create Listing'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={loading}
                        className="px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-colors"
                        style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--bg-lighter)' }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
