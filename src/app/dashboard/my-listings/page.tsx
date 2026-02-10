'use client'

import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { deleteAllListingImages } from '@/lib/supabase/storage'
import type { Listing, ListingImage } from '@/types/database'

interface ListingWithImages extends Listing {
    images: ListingImage[]
}

type FilterTab = 'all' | 'active' | 'completed'

export default function MyListingsPage() {
    const { user } = useUser()
    const { signOut } = useClerk()
    const [listings, setListings] = useState<ListingWithImages[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<FilterTab>('all')
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    useEffect(() => {
        if (user?.id) {
            fetchListings()
        }
    }, [user?.id])

    const fetchListings = async () => {
        if (!user?.id) return

        const supabase = createClient()

        const { data: listingsData, error: listingsError } = await supabase
            .from('listings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (listingsError) {
            console.error('Error fetching listings:', listingsError)
            setLoading(false)
            return
        }

        const listingsWithImages: ListingWithImages[] = await Promise.all(
            (listingsData || []).map(async (listing) => {
                const { data: images } = await supabase
                    .from('listing_images')
                    .select('*')
                    .eq('listing_id', listing.id)
                    .order('order', { ascending: true })

                return {
                    ...listing,
                    images: images || []
                }
            })
        )

        setListings(listingsWithImages)
        setLoading(false)
    }

    const markAsCompleted = async (listingId: string) => {
        setUpdatingId(listingId)
        const supabase = createClient()

        try {
            const { error } = await supabase
                .from('listings')
                .update({ status: 'sold' })
                .eq('id', listingId)

            if (error) throw error

            setListings(listings.map(l =>
                l.id === listingId ? { ...l, status: 'sold' as const } : l
            ))
        } catch (error) {
            console.error('Error updating listing:', error)
            alert('Failed to mark as completed')
        } finally {
            setUpdatingId(null)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`
    }

    const filteredListings = listings.filter(listing => {
        if (activeTab === 'active') return listing.status === 'available'
        if (activeTab === 'completed') return listing.status === 'sold'
        return true
    })

    const activeCount = listings.filter(l => l.status === 'available').length
    const completedCount = listings.filter(l => l.status === 'sold').length

    if (loading) {
        return (
            <div className="min-h-screen bg-[#e8f4f5] flex items-center justify-center">
                <p className="text-[#5a6c7d]">Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#e8f4f5]">
            {/* Header */}
            <header className="bg-white border-b border-[#d4e8ea] px-8 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-[#22c1c3] rounded-lg flex items-center justify-center text-white font-bold">
                            ⚡
                        </div>
                        <span className="text-xl font-bold text-[#2c3e50]">OhmPlace</span>
                    </Link>
                    <button
                        onClick={() => signOut()}
                        className="text-[#5a6c7d] hover:text-[#2c3e50] transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Page Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2c3e50] mb-1">My Listings</h1>
                        <p className="text-[#95a5a6]">
                            {activeCount} active, {completedCount} completed
                        </p>
                    </div>
                    <Link
                        href="/dashboard/new-listing"
                        className="bg-[#22c1c3] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1a9a9b] transition-colors flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Post a Part
                    </Link>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'all'
                                ? 'bg-[#22c1c3] text-white'
                                : 'bg-white text-[#5a6c7d] hover:bg-[#f4fafb]'
                            }`}
                    >
                        All ({listings.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'active'
                                ? 'bg-[#22c1c3] text-white'
                                : 'bg-white text-[#5a6c7d] hover:bg-[#f4fafb]'
                            }`}
                    >
                        Active ({activeCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'completed'
                                ? 'bg-[#22c1c3] text-white'
                                : 'bg-white text-[#5a6c7d] hover:bg-[#f4fafb]'
                            }`}
                    >
                        Completed ({completedCount})
                    </button>
                </div>

                {/* Listings Grid */}
                {filteredListings.length === 0 ? (
                    <div className="bg-white rounded-lg p-12 text-center">
                        <p className="text-[#95a5a6]">No listings in this category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredListings.map((listing) => (
                            <div key={listing.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Image */}
                                {listing.images.length > 0 && (
                                    <div className="aspect-video bg-gray-100 relative">
                                        <img
                                            src={listing.images[0].image_url}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-4">
                                    {/* Title and Status */}
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-bold text-[#2c3e50]">{listing.title}</h3>
                                        {listing.status === 'available' && (
                                            <span className="bg-[#22c1c3]/10 text-[#22c1c3] px-2 py-1 rounded text-xs font-medium">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        <span className="bg-gray-100 text-[#5a6c7d] px-3 py-1 rounded-full text-xs">
                                            {listing.category}
                                        </span>
                                        <span className="bg-gray-100 text-[#5a6c7d] px-3 py-1 rounded-full text-xs">
                                            {listing.condition === 'new' ? 'New' : listing.condition === 'used-good' ? 'Like New' : 'Used - Fair'}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="text-2xl font-bold text-[#22c1c3] mb-3">
                                        {formatPrice(listing.price)}
                                    </div>

                                    {/* Description (if exists) */}
                                    {listing.description && (
                                        <p className="text-sm text-[#5a6c7d] mb-3 line-clamp-2">
                                            {listing.description}
                                        </p>
                                    )}

                                    {/* Footer */}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                        <span className="text-sm text-[#95a5a6]">
                                            {formatDate(listing.created_at)}
                                        </span>
                                        {listing.status === 'available' ? (
                                            <button
                                                onClick={() => markAsCompleted(listing.id)}
                                                disabled={updatingId === listing.id}
                                                className="text-[#22c1c3] text-sm font-medium hover:text-[#1a9a9b] disabled:opacity-50"
                                            >
                                                {updatingId === listing.id ? 'Updating...' : 'Mark Completed'}
                                            </button>
                                        ) : (
                                            <span className="text-[#95a5a6] text-sm">Sold</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
