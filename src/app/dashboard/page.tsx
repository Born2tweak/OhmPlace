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

        // For "Trending", we'll just fetch the 3 most recent listings for now
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

    // Extract university name from email (mock logic based on landing page)
    const schoolName = user?.primaryEmailAddress?.emailAddress?.match(/@(.+\.edu)$/i)?.[1]?.replace('.edu', '').toUpperCase() || 'University'

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Greeting Section */}
            <div className="bg-[#22c1c3] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Good morning, {user?.firstName || 'Student'}!</h1>
                    <div className="flex items-center gap-2 opacity-90">
                        <span className="text-xl">🎓</span>
                        <span className="font-medium">Engineering Faculty, {schoolName}</span>
                    </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mock data for now as these features aren't backend-backed yet */}
                <StatsCard
                    title="Items Sold"
                    value="14"
                    trend="+2 this week"
                />
                <StatsCard
                    title="Active Requests"
                    value="3"
                />
                <StatsCard
                    title="Community Karma"
                    value="1,420"
                    trend="Top 5%"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Trending Section */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#2c3e50] flex items-center gap-2">
                                <span className="text-[#22c1c3]">🔥</span> Trending on Campus
                            </h2>
                            <Link href="/dashboard/marketplace" className="text-sm font-medium text-[#22c1c3] hover:underline">
                                View Marketplace
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-xl h-64 animate-pulse bg-gray-100"></div>
                                ))
                            ) : (
                                trendingListings.map(listing => (
                                    <ListingCard
                                        key={listing.id}
                                        listing={listing}
                                    // Compact version could be created, but standard card works for now
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    {/* Community (Placeholder) */}
                    <section className="bg-gradient-to-r from-[#2c3e50] to-[#34495e] rounded-xl p-6 text-white">
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

                {/* Right Column (Sidebar Widgets) */}
                <div className="space-y-6">
                    <QuickActionCard />
                    <ActivityFeed />
                </div>
            </div>
        </div>
    )
}
