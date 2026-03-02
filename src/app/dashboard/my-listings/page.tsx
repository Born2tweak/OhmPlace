'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Listing, ListingImage } from '@/types/database'
import ListingCard from '@/components/ListingCard'
import BoostModal from '@/components/BoostModal'
import { Zap, Trash2, Loader2 } from 'lucide-react'

interface ListingWithImages extends Listing {
    images: ListingImage[]
}

type FilterTab = 'all' | 'active' | 'sold'

function MyListingsContent() {
    const { user } = useUser()
    const { signOut } = useClerk()
    const searchParams = useSearchParams()
    const [listings, setListings] = useState<ListingWithImages[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<FilterTab>('all')
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [boostListingId, setBoostListingId] = useState<string | null>(null)
    const [showBoostedBanner, setShowBoostedBanner] = useState(false)

    useEffect(() => {
        if (searchParams.get('boosted') === 'true') {
            setShowBoostedBanner(true)
            setTimeout(() => setShowBoostedBanner(false), 5000)
        }
    }, [searchParams])

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

    const markAsSold = async (listingId: string) => {
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

    const deleteListing = async (listingId: string) => {
        if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return

        setDeletingId(listingId)
        const supabase = createClient()

        try {
            // Delete images first (foreign key)
            const { error: imgError } = await supabase
                .from('listing_images')
                .delete()
                .eq('listing_id', listingId)

            if (imgError) throw imgError

            // Delete the listing
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listingId)

            if (error) throw error

            setListings(listings.filter(l => l.id !== listingId))
        } catch (error) {
            console.error('Error deleting listing:', error)
            alert('Failed to delete listing')
        } finally {
            setDeletingId(null)
        }
    }

    const isPromoted = (listing: ListingWithImages) => {
        return listing.promoted && listing.promoted_until && new Date(listing.promoted_until) > new Date()
    }

    const filteredListings = listings.filter(listing => {
        if (activeTab === 'active') return listing.status === 'available'
        if (activeTab === 'sold') return listing.status === 'sold'
        return true
    })

    const activeCount = listings.filter(l => l.status === 'available').length
    const completedCount = listings.filter(l => l.status === 'sold').length

    const boostListing = listings.find(l => l.id === boostListingId)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            </div>
        )
    }

    return (
        <div>
            {/* Boosted success banner */}
            {showBoostedBanner && (
                <div className="mb-4 p-4 rounded-lg text-sm font-medium flex items-center gap-2"
                    style={{ background: 'color-mix(in srgb, #22c55e 15%, transparent)', color: '#16a34a', border: '1px solid #22c55e' }}>
                    <Zap className="w-4 h-4" />
                    Your listing has been boosted! It will appear at the top of the marketplace.
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>My Listings</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {activeCount} active, {completedCount} sold
                    </p>
                </div>
                <Link
                    href="/dashboard/new-listing"
                    className="w-full sm:w-auto text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    style={{ background: 'var(--brand-primary)' }}
                >
                    <span className="text-xl">+</span> Post a Part
                </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-8">
                {([
                    { key: 'all' as FilterTab, label: `All (${listings.length})` },
                    { key: 'active' as FilterTab, label: `Active (${activeCount})` },
                    { key: 'sold' as FilterTab, label: `Sold (${completedCount})` },
                ]).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                        style={{
                            background: activeTab === tab.key ? 'var(--brand-primary)' : 'var(--bg-card)',
                            color: activeTab === tab.key ? '#ffffff' : 'var(--text-secondary)',
                            border: activeTab === tab.key ? 'none' : '1px solid var(--border-subtle)',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Listings Grid */}
            {filteredListings.length === 0 ? (
                <div className="rounded-lg p-12 text-center" style={{ background: 'var(--bg-card)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No listings in this category</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredListings.map((listing) => (
                        <div key={listing.id} className="relative flex flex-col">
                            <ListingCard
                                listing={listing}
                                actionLabel={listing.status === 'available' ? 'Mark Sold' : undefined}
                                onAction={listing.status === 'available' ? (l) => markAsSold(l.id) : undefined}
                            />
                            <div className="mt-3 flex gap-2">
                                {listing.status === 'available' && (
                                    <div className="flex-1">
                                        {isPromoted(listing) ? (
                                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl"
                                                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff' }}>
                                                <Zap className="w-3.5 h-3.5" />
                                                Boosted until {new Date(listing.promoted_until!).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setBoostListingId(listing.id)}
                                                className="w-full flex items-center justify-center gap-1.5 text-sm font-bold px-3 py-2.5 rounded-xl transition-all hover:shadow-md"
                                                style={{
                                                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                                    color: '#fff',
                                                }}
                                            >
                                                <Zap className="w-4 h-4" />
                                                Boost Listing
                                            </button>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={() => deleteListing(listing.id)}
                                    disabled={deletingId === listing.id}
                                    className="flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-md"
                                    style={{
                                        background: 'rgba(239,68,68,0.1)',
                                        color: '#EF4444',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                    }}
                                    title="Delete listing"
                                >
                                    {deletingId === listing.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Boost Modal */}
            {boostListing && (
                <BoostModal
                    isOpen={!!boostListingId}
                    onClose={() => setBoostListingId(null)}
                    listingId={boostListing.id}
                    listingTitle={boostListing.title}
                />
            )}
        </div>
    )
}

export default function MyListingsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-16">
                <div className="skeleton h-8 w-48" />
            </div>
        }>
            <MyListingsContent />
        </Suspense>
    )
}
