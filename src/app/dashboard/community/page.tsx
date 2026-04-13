'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

export const dynamic = 'force-dynamic'
import { Plus, Flame, Clock, TrendingUp, Users, GraduationCap, ChevronDown } from 'lucide-react'
import PostCard from '@/components/community/PostCard'
import CreatePostModal from '@/components/community/CreatePostModal'
import PullToRefresh from '@/components/PullToRefresh'
import { useCampus } from '@/components/CampusContext'

interface Post {
    id: string
    user_id: string
    username: string
    campus: string
    title: string
    body: string | null
    flair: string | null
    image_url: string | null
    upvotes: number
    downvotes: number
    comment_count: number
    created_at: string
    userVote: number
}

type SortOption = 'hot' | 'new' | 'best'

export default function CommunityPage() {
    const { user } = useUser()
    const campus = useCampus()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [sort, setSort] = useState<SortOption>('hot')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [campusFilter, setCampusFilter] = useState<string>('mine')
    const [availableCampuses, setAvailableCampuses] = useState<string[]>([])

    const emailDomain = user?.primaryEmailAddress?.emailAddress?.split('@')[1] || ''

    useEffect(() => {
        fetch('/api/community/campuses')
            .then(r => r.ok ? r.json() : [])
            .then((data: string[]) => setAvailableCampuses(data))
            .catch(() => {})
    }, [])

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/community/posts?sort=${sort}&campusFilter=${encodeURIComponent(campusFilter)}`)
            if (res.ok) {
                const data = await res.json()
                setPosts(data)
            }
        } finally {
            setLoading(false)
        }
    }, [sort, campusFilter])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    const handleCreatePost = async (data: { title: string; body: string; flair: string | null; image_url?: string | null }) => {
        const res = await fetch('/api/community/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (res.ok) {
            fetchPosts()
        }
    }

    const handleVote = async (postId: string, vote: number) => {
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p
            const oldVote = p.userVote
            let upDelta = 0, downDelta = 0
            if (oldVote === 1) upDelta--
            if (oldVote === -1) downDelta--
            if (vote === 1) upDelta++
            if (vote === -1) downDelta++
            return {
                ...p,
                upvotes: p.upvotes + upDelta,
                downvotes: p.downvotes + downDelta,
                userVote: vote
            }
        }))

        await fetch(`/api/community/posts/${postId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote })
        })
    }

    const handleDelete = async (postId: string) => {
        if (!confirm('Delete this post?')) return
        const res = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' })
        if (res.ok) {
            setPosts(prev => prev.filter(p => p.id !== postId))
        }
    }

    const sortOptions: { key: SortOption; label: string; icon: React.ReactNode }[] = [
        { key: 'hot', label: 'Hot', icon: <Flame className="w-4 h-4" /> },
        { key: 'new', label: 'New', icon: <Clock className="w-4 h-4" /> },
        { key: 'best', label: 'Best', icon: <TrendingUp className="w-4 h-4" /> },
    ]

    return (
        <PullToRefresh onRefresh={fetchPosts}>
            <div className="max-w-3xl mx-auto space-y-4">
                {/* Community header */}
                <div className="glass rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}>
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {campusFilter === 'mine' && campus
                                        ? campus
                                        : campusFilter === 'all'
                                        ? 'All Schools'
                                        : campusFilter} Community
                                </h1>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {campusFilter === 'mine' ? emailDomain : campusFilter === 'all' ? 'Viewing all campuses' : campusFilter}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl transition-all text-sm hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', boxShadow: 'var(--shadow-button)' }}
                        >
                            <Plus className="w-4 h-4" />
                            Create Post
                        </button>
                    </div>

                    {/* Campus filter */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        {campus && (
                            <button
                                onClick={() => setCampusFilter('mine')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                                style={{
                                    background: campusFilter === 'mine' ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' : 'var(--bg-lighter)',
                                    color: campusFilter === 'mine' ? '#fff' : 'var(--text-secondary)',
                                    border: campusFilter === 'mine' ? 'none' : '1px solid var(--border-subtle)',
                                }}
                            >
                                <GraduationCap className="w-3.5 h-3.5" />
                                My School
                            </button>
                        )}
                        <div className="relative">
                            <select
                                value={campusFilter === 'mine' ? '' : campusFilter}
                                onChange={(e) => setCampusFilter(e.target.value || 'mine')}
                                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors cursor-pointer"
                                style={{
                                    background: campusFilter !== 'mine' ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' : 'var(--bg-lighter)',
                                    color: campusFilter !== 'mine' ? '#fff' : 'var(--text-secondary)',
                                    border: campusFilter !== 'mine' ? 'none' : '1px solid var(--border-subtle)',
                                }}
                            >
                                <option value="">All Schools</option>
                                {availableCampuses.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 pointer-events-none"
                                style={{ color: campusFilter !== 'mine' ? '#fff' : 'var(--text-muted)' }} />
                        </div>
                    </div>
                </div>

                {/* Sort tabs */}
                <div className="glass rounded-xl px-4 py-2">
                    <div className="flex items-center gap-1">
                        {sortOptions.map(({ key, label, icon }) => (
                            <button
                                key={key}
                                onClick={() => setSort(key)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                style={{
                                    background: sort === key ? 'color-mix(in srgb, var(--brand-primary) 12%, transparent)' : 'transparent',
                                    color: sort === key ? 'var(--brand-primary)' : 'var(--text-muted)',
                                }}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Posts feed */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full skeleton" />
                                    <div className="skeleton h-4 w-24" />
                                </div>
                                <div className="skeleton h-5 w-3/4 mb-2" />
                                <div className="skeleton h-4 w-full mb-1" />
                                <div className="skeleton h-4 w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' }}>
                            <Users className="w-8 h-8" style={{ color: 'var(--brand-primary)' }} />
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No posts yet</h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Be the first to start a conversation in your campus community!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2.5 text-white font-semibold rounded-xl transition-all text-sm hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', boxShadow: 'var(--shadow-button)' }}
                        >
                            Create the First Post
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 max-w-full lg:max-w-2xl">
                        {posts.map((post, i) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUserId={user?.id || ''}
                                onVote={handleVote}
                                onDelete={handleDelete}
                                index={i}
                            />
                        ))}
                    </div>
                )}

                <CreatePostModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreatePost}
                />
            </div>
        </PullToRefresh>
    )
}
