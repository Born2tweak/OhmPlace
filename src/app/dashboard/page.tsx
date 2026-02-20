'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import StatsCard from '@/components/StatsCard'
import QuickActionCard from '@/components/QuickActionCard'
import ActivityFeed from '@/components/ActivityFeed'
import ListingCard from '@/components/ListingCard'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Listing, ListingImage } from '@/types/database'
import { ShoppingBag, MessageSquare, Users } from 'lucide-react'

interface ListingWithImages extends Listing {
    images: ListingImage[]
}

export default function DashboardPage() {
    const { user } = useUser()
    const [trendingListings, setTrendingListings] = useState<ListingWithImages[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTrending()
    }, [])

    const fetchTrending = async () => {
        const supabase = createClient()

        const { data: listingsData } = await supabase
            .from('listings')
            .select('*')
            .eq('status', 'available')
            .order('created_at', { ascending: false })
            .limit(3)

        if (listingsData) {
            const listingsWithImages: ListingWithImages[] = await Promise.all(
                listingsData.map(async (listing) => {
                    const { data: images } = await supabase
                        .from('listing_images')
                        .select('*')
                        .eq('listing_id', listing.id)
                        .order('order', { ascending: true })
                        .limit(1)

                    return {
                        ...listing,
                        images: images || []
                    }
                })
            )
            setTrendingListings(listingsWithImages)
        }
        setLoading(false)
    }

    const schoolName = user?.primaryEmailAddress?.emailAddress?.match(/@(.+\.edu)$/i)?.[1]?.replace('.edu', '').toUpperCase() || 'University'

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Greeting Section */}
            <div className="rounded-2xl p-8 text-white shadow-lg relative overflow-hidden"
                style={{ background: 'var(--brand-primary)' }}>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">{getGreeting()}, {user?.firstName || 'Student'}!</h1>
                    <div className="flex items-center gap-2 opacity-90">
                        <span className="text-xl">🎓</span>
                        <span className="font-medium">{schoolName}</span>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="Items Sold" value="14" trend="+2 this week" />
                <StatsCard title="Active Requests" value="3" />
                <StatsCard title="Community Karma" value="1,420" trend="Top 5%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span style={{ color: 'var(--brand-primary)' }}>🔥</span> Trending on Campus
                            </h2>
                            <Link href="/dashboard/marketplace" className="text-sm font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
                                View Marketplace
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="rounded-xl h-64 animate-pulse" style={{ background: 'var(--bg-card)' }}></div>
                                ))
                            ) : (
                                trendingListings.map(listing => (
                                    <ListingCard key={listing.id} listing={listing} />
                                ))
                            )}
                        </div>
                    </section>

                    {/* Community */}
                    <section className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #2c3e50, #34495e)' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold mb-1">Join the Discussion</h3>
                                <p className="text-gray-300 text-sm">Ask for help, share projects, or find study partners.</p>
                            </div>
                            <Link href="/dashboard/community" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                                <Users className="w-5 h-5" />
                            </Link>
                        </div>
                    </section>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <QuickActionCard />
                    <ActivityFeed />
                </div>
            </div>
        </div>
    )
}
