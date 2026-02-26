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
    const [itemsSold, setItemsSold] = useState(0)
    const [activeListings, setActiveListings] = useState(0)
    const [unreadMessages, setUnreadMessages] = useState(0)

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData()
        }
    }, [user?.id])

    const fetchDashboardData = async () => {
        const supabase = createClient()

        // Fetch all dashboard data in parallel
        const [trendingResult, soldResult, activeResult, messagesResult] = await Promise.all([
            // Trending listings
            supabase
                .from('listings')
                .select('*')
                .eq('status', 'available')
                .order('created_at', { ascending: false })
                .limit(3),

            // Items sold by current user
            supabase
                .from('listings')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user!.id)
                .eq('status', 'sold'),

            // Active listings by current user
            supabase
                .from('listings')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user!.id)
                .eq('status', 'available'),

            // Unread messages for current user
            supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .neq('sender_id', user!.id)
                .eq('status', 'sent')
                .in('conversation_id',
                    (await supabase
                        .from('conversations')
                        .select('id')
                        .or(`participant_1.eq.${user!.id},participant_2.eq.${user!.id}`)
                    ).data?.map(c => c.id) || []
                ),
        ])

        // Set stats
        setItemsSold(soldResult.count ?? 0)
        setActiveListings(activeResult.count ?? 0)
        setUnreadMessages(messagesResult.count ?? 0)

        // Set trending listings with images
        if (trendingResult.data) {
            const listingsWithImages: ListingWithImages[] = await Promise.all(
                trendingResult.data.map(async (listing) => {
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
            <div className="rounded-2xl p-8 text-white shadow-lg relative overflow-hidden animate-fade-in-up"
                style={{ background: 'var(--brand-primary)', opacity: 0 }}>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
                <StatsCard title="Items Sold" value={itemsSold} icon={<ShoppingBag className="w-5 h-5" />} href="/dashboard/my-listings" />
                <StatsCard title="Active Listings" value={activeListings} icon={<ShoppingBag className="w-5 h-5" />} href="/dashboard/my-listings" />
                <StatsCard
                    title="Unread Messages"
                    value={unreadMessages}
                    icon={<MessageSquare className="w-5 h-5" />}
                    trend={unreadMessages > 0 ? `${unreadMessages} new` : undefined}
                    href="/dashboard/messages"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
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
                            ) : trendingListings.length > 0 ? (
                                trendingListings.map((listing, i) => (
                                    <ListingCard key={listing.id} listing={listing} linkTo={`/dashboard/marketplace/${listing.id}`} index={i} />
                                ))
                            ) : (
                                <div className="col-span-full rounded-xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No listings yet. Be the first to post!</p>
                                </div>
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
                    <ActivityFeed userId={user?.id} />
                </div>
            </div>
        </div>
    )
}
