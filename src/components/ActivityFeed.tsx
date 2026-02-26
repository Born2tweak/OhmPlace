'use client'

import React, { useEffect, useState } from 'react'
import { ShoppingBag, Star, MessageSquare, Tag, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Activity {
    id: string
    type: 'listing_created' | 'listing_sold' | 'message_received' | 'community_post'
    title: string
    description: string
    time: string
    rawTime: string
}

function timeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
}

const activityConfig = {
    listing_created: {
        icon: Tag,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
    },
    listing_sold: {
        icon: ShoppingBag,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
    },
    message_received: {
        icon: MessageSquare,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
    },
    community_post: {
        icon: Users,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
    },
}

interface ActivityFeedProps {
    userId?: string
}

export default function ActivityFeed({ userId }: ActivityFeedProps) {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userId) {
            fetchActivity()
        } else {
            setLoading(false)
        }
    }, [userId])

    const fetchActivity = async () => {
        const supabase = createClient()
        const activities: Activity[] = []

        // Fetch user's recent listings (created & sold)
        const { data: recentListings } = await supabase
            .from('listings')
            .select('id, title, status, created_at, updated_at')
            .eq('user_id', userId!)
            .order('updated_at', { ascending: false })
            .limit(10)

        if (recentListings) {
            for (const listing of recentListings) {
                if (listing.status === 'sold') {
                    activities.push({
                        id: `sold-${listing.id}`,
                        type: 'listing_sold',
                        title: 'Item Sold',
                        description: listing.title,
                        time: timeAgo(listing.updated_at),
                        rawTime: listing.updated_at,
                    })
                }
                activities.push({
                    id: `created-${listing.id}`,
                    type: 'listing_created',
                    title: 'Listed',
                    description: listing.title,
                    time: timeAgo(listing.created_at),
                    rawTime: listing.created_at,
                })
            }
        }

        // Fetch recent messages received
        const { data: convos } = await supabase
            .from('conversations')
            .select('id')
            .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)

        if (convos && convos.length > 0) {
            const convoIds = convos.map(c => c.id)
            const { data: recentMessages } = await supabase
                .from('messages')
                .select('id, text, created_at, sender_id')
                .in('conversation_id', convoIds)
                .neq('sender_id', userId!)
                .order('created_at', { ascending: false })
                .limit(5)

            if (recentMessages) {
                for (const msg of recentMessages) {
                    activities.push({
                        id: `msg-${msg.id}`,
                        type: 'message_received',
                        title: 'New Message',
                        description: msg.text.length > 60 ? msg.text.substring(0, 60) + '…' : msg.text,
                        time: timeAgo(msg.created_at),
                        rawTime: msg.created_at,
                    })
                }
            }
        }

        // Fetch recent community posts by user
        const { data: recentPosts } = await supabase
            .from('posts')
            .select('id, title, created_at')
            .eq('user_id', userId!)
            .order('created_at', { ascending: false })
            .limit(5)

        if (recentPosts) {
            for (const post of recentPosts) {
                activities.push({
                    id: `post-${post.id}`,
                    type: 'community_post',
                    title: 'Community Post',
                    description: post.title,
                    time: timeAgo(post.created_at),
                    rawTime: post.created_at,
                })
            }
        }

        // Sort by most recent
        activities.sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime())

        setActivities(activities.slice(0, 6))
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="rounded-xl p-6 shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full" style={{ background: 'var(--bg-lighter)' }}></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 rounded w-24" style={{ background: 'var(--bg-lighter)' }}></div>
                                <div className="h-3 rounded w-36" style={{ background: 'var(--bg-lighter)' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl p-6 shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>

            {activities.length === 0 ? (
                <div className="text-center py-6">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity yet.</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>List an item or start a conversation!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {activities.map((activity) => {
                        const config = activityConfig[activity.type]
                        const Icon = config.icon
                        return (
                            <div key={activity.id} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                    <Icon className={`w-4 h-4 ${config.color}`} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activity.title}</h4>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{activity.description}</p>
                                    <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>{activity.time}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
