'use client'

import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Listing, ListingImage } from '@/types/database'
import ListingCard from '@/components/ListingCard'

interface ListingWithImages extends Listing {
    images: ListingImage[]
}

type FilterTab = 'all' | 'active' | 'sold'

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
            alert('Failed to mark as sold')
        } finally {
            setUpdatingId(null)
        }
    }

    const filteredListings = listings.filter(listing => {
        if (activeTab === 'active') return listing.status === 'available'
        if (activeTab === 'sold') return listing.status === 'sold'
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
                            {activeCount} active, {completedCount} sold
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
                        onClick={() => setActiveTab('sold')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'sold'
                            ? 'bg-[#22c1c3] text-white'
                            : 'bg-white text-[#5a6c7d] hover:bg-[#f4fafb]'
                            }`}
                    >
                        Sold ({completedCount})
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
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                actionLabel={listing.status === 'available' ? 'Mark Sold' : undefined}
                                onAction={listing.status === 'available' ? (l) => markAsCompleted(l.id) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
