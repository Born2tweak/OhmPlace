'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

export const dynamic = 'force-dynamic'
import { Plus, Flame, Clock, TrendingUp, Users, Loader2, AlertCircle } from 'lucide-react'
import PostCard from '@/components/community/PostCard'
import CreatePostModal from '@/components/community/CreatePostModal'
import CommunitySidebar from '@/components/community/CommunitySidebar'

interface Post {
    id: string
    user_id: string
    username: string
    campus: string
    title: string
    body: string | null
    flair: string | null
    upvotes: number
    downvotes: number
    comment_count: number
    created_at: string
    userVote: number
}

type SortOption = 'hot' | 'new' | 'best'

export default function CommunityPage() {
    const { user } = useUser()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sort, setSort] = useState<SortOption>('hot')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedFlair, setSelectedFlair] = useState<string | null>(null)

    const campus = user?.primaryEmailAddress?.emailAddress?.split('@')[1] || ''

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/community/posts?sort=${sort}`)
            if (res.ok) {
                const data = await res.json()
                setPosts(data)
            } else {
                const data = await res.json().catch(() => ({}))
                setError(data.error || `Server error (${res.status})`)
            }
        } catch {
            setError('Failed to load posts. Check your connection.')
        } finally {
            setLoading(false)
        }
    }, [sort])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    const handleCreatePost = async (data: { title: string; body: string; flair: string | null }) => {
        const res = await fetch('/api/community/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (res.ok) {
            fetchPosts()
        } else {
            const errData = await res.json().catch(() => ({}))
            throw new Error(errData.error || 'Failed to create post')
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

    const filteredPosts = selectedFlair
        ? posts.filter(p => p.flair === selectedFlair)
        : posts

    const postsToday = posts.filter(p => {
        const d = new Date(p.created_at)
        const now = new Date()
        return d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
    }).length

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex gap-6">
                {/* Main feed */}
                <div className="flex-1 min-w-0 space-y-4">
                    {/* Community header */}
                    <div className="rounded-xl shadow-sm p-5"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}>
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {campus ? campus.split('.')[0].charAt(0).toUpperCase() + campus.split('.')[0].slice(1) : 'Campus'} Community
                                    </h1>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{campus || 'Your campus feed'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-full transition-all duration-200 text-sm hover:opacity-90 active:scale-95"
                                style={{ background: 'var(--brand-primary)' }}
                            >
                                <Plus className="w-4 h-4" />
                                Create Post
                            </button>
                        </div>
                    </div>

                    {/* Sort tabs */}
                    <div className="rounded-xl shadow-sm px-4 py-2"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-1">
                            {sortOptions.map(({ key, label, icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setSort(key)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
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

                    {/* Error banner */}
                    {error && (
                        <div className="rounded-xl p-4 flex items-center gap-3"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-600">Couldn&apos;t load posts</p>
                                <p className="text-xs text-red-500 mt-0.5">{error}</p>
                            </div>
                            <button onClick={fetchPosts} className="ml-auto text-xs font-semibold text-red-600 underline">
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Feed */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="rounded-xl shadow-sm p-12 text-center"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' }}>
                                <Users className="w-8 h-8" style={{ color: 'var(--brand-primary)' }} />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                {selectedFlair ? `No "${selectedFlair}" posts yet` : 'No posts yet'}
                            </h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                                {selectedFlair
                                    ? 'Try a different flair or create one!'
                                    : 'Be the first to start a conversation in your campus community!'}
                            </p>
                            {!selectedFlair && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-2 text-white font-semibold rounded-full transition-all text-sm hover:opacity-90"
                                    style={{ background: 'var(--brand-primary)' }}
                                >
                                    Create the First Post
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredPosts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={user?.id || ''}
                                    onVote={handleVote}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="w-80 shrink-0 hidden lg:block">
                    <CommunitySidebar
                        campus={campus}
                        memberCount={Math.max(posts.length * 3, 0)}
                        activeNow={Math.max(1, Math.floor(Math.random() * 8) + 2)}
                        postsToday={postsToday}
                        onCreatePost={() => setShowCreateModal(true)}
                        selectedFlair={selectedFlair}
                        onFlairFilter={setSelectedFlair}
                    />
                </div>
            </div>

            <CreatePostModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreatePost}
            />
        </div>
    )
}
