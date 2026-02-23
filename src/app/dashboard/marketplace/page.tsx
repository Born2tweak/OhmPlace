'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ListingCard from '@/components/ListingCard'
import { Search, Filter, X } from 'lucide-react'
import type { Listing, ListingImage } from '@/types/database'

interface ListingWithImages extends Listing {
    images: ListingImage[]
}

const CATEGORIES = [
    'Textbooks',
    'Electronics',
    'Furniture',
    'Clothing',
    'School Supplies',
    'Other'
]

const CONDITIONS = [
    'New',
    'Like New',
    'Good',
    'Fair',
    'Poor'
]

export default function MarketplacePage() {
    const [listings, setListings] = useState<ListingWithImages[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [selectedCondition, setSelectedCondition] = useState<string>('')
    const [showFilters, setShowFilters] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchListings()
    }, [])

    const fetchListings = async () => {
        setLoading(true)
        const { data: listingsData, error } = await supabase
            .from('listings')
            .select('*')
            .eq('status', 'available')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching listings:', error)
            setLoading(false)
            return
        }

        if (listingsData) {
            const listingsWithImages = await Promise.all(
                listingsData.map(async (listing) => {
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
        }
        setLoading(false)
    }

    const filteredListings = listings.filter(listing => {
        const matchesSearch =
            listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            listing.description?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCategory = selectedCategory ? listing.category === selectedCategory : true
        const matchesCondition = selectedCondition ? listing.condition === selectedCondition : true

        return matchesSearch && matchesCategory && matchesCondition
    }).sort((a, b) => {
        const aPromoted = a.promoted && a.promoted_until && new Date(a.promoted_until) > new Date()
        const bPromoted = b.promoted && b.promoted_until && new Date(b.promoted_until) > new Date()
        if (aPromoted && !bPromoted) return -1
        if (!aPromoted && bPromoted) return 1
        return 0
    })

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedCategory('')
        setSelectedCondition('')
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Marketplace</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Browse all items posted by students</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Search listings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
                        style={{
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                        }}
                    />
                    <Search className="absolute left-3 top-2.5 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 rounded-xl shadow-sm"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between mb-4 md:mb-0">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 font-medium md:hidden"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                    {(selectedCategory || selectedCondition || searchTerm) && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 md:hidden"
                        >
                            <X className="w-3 h-3" /> Clear
                        </button>
                    )}
                </div>

                <div className={`${showFilters ? 'block' : 'hidden'} md:flex flex-col md:flex-row gap-4 items-center`}>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 hidden md:block" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--text-secondary)' }}>Filters:</span>
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full md:w-48 p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                        style={{
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <select
                        value={selectedCondition}
                        onChange={(e) => setSelectedCondition(e.target.value)}
                        className="w-full md:w-48 p-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                        style={{
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        <option value="">All Conditions</option>
                        {CONDITIONS.map(cond => (
                            <option key={cond} value={cond}>{cond}</option>
                        ))}
                    </select>

                    {(selectedCategory || selectedCondition) && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 ml-auto hidden md:flex"
                        >
                            <X className="w-3 h-3" /> Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="rounded-xl aspect-[4/5] animate-pulse"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}></div>
                    ))}
                </div>
            ) : filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredListings.map((listing) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            linkTo={`/dashboard/marketplace/${listing.id}`}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 rounded-xl border-dashed"
                    style={{ background: 'var(--bg-card)', border: '2px dashed var(--border-subtle)' }}>
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No listings found</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or filters to find what you&apos;re looking for.</p>
                    <button
                        onClick={clearFilters}
                        className="mt-6 font-medium hover:underline"
                        style={{ color: 'var(--brand-primary)' }}
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    )
}
