'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Plus, Flame, Clock, TrendingUp, Users, Loader2 } from 'lucide-react'
import PostCard from '@/components/community/PostCard'
import CreatePostModal from '@/components/community/CreatePostModal'

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
    const [sort, setSort] = useState<SortOption>('hot')
    const [showCreateModal, setShowCreateModal] = useState(false)

    const campus = user?.primaryEmailAddress?.emailAddress?.split('@')[1] || ''

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/community/posts?sort=${sort}`)
            if (res.ok) {
                const data = await res.json()
                setPosts(data)
            }
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
        }
    }

    const handleVote = async (postId: string, vote: number) => {
        // Optimistic update
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
        <div className="space-y-4">
            {/* Community header */}
            <div className="bg-white rounded-lg shadow-sm border border-[#d4e8ea] p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#22c1c3] to-[#15868e] rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[#2c3e50]">
                                {campus ? campus.split('.')[0].charAt(0).toUpperCase() + campus.split('.')[0].slice(1) : 'Campus'} Community
                            </h1>
                            <p className="text-sm text-[#95a5a6]">{campus}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#22c1c3] text-white font-medium rounded-full hover:bg-[#1a9a9b] transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Post
                    </button>
                </div>
            </div>

            {/* Sort tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-[#d4e8ea] px-4 py-2">
                <div className="flex items-center gap-1">
                    {sortOptions.map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setSort(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                sort === key
                                    ? 'bg-[#22c1c3]/10 text-[#22c1c3]'
                                    : 'text-[#95a5a6] hover:bg-[#f4fafb] hover:text-[#5a6c7d]'
                            }`}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Posts feed */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-[#22c1c3] animate-spin" />
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-[#d4e8ea] p-12 text-center">
                    <div className="w-16 h-16 bg-[#22c1c3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-[#22c1c3]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#2c3e50] mb-2">No posts yet</h3>
                    <p className="text-sm text-[#95a5a6] mb-4">Be the first to start a conversation in your campus community!</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2 bg-[#22c1c3] text-white font-medium rounded-full hover:bg-[#1a9a9b] transition-colors text-sm"
                    >
                        Create the First Post
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {posts.map(post => (
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

            <CreatePostModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreatePost}
            />
        </div>
    )
}
