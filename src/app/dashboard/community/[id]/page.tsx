'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageSquare, Share2, Trash2, Loader2 } from 'lucide-react'
import VoteButton from '@/components/community/VoteButton'
import FlairBadge from '@/components/community/FlairBadge'
import CommentSection from '@/components/community/CommentSection'

interface Comment {
    id: string
    user_id: string
    username: string
    body: string
    upvotes: number
    downvotes: number
    created_at: string
    userVote: number
}

interface PostDetail {
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
    comments: Comment[]
}

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { user } = useUser()
    const router = useRouter()
    const [post, setPost] = useState<PostDetail | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchPost = useCallback(async () => {
        try {
            const res = await fetch(`/api/community/posts/${id}`)
            if (res.ok) {
                const data = await res.json()
                setPost(data)
            }
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchPost()
    }, [fetchPost])

    const handleVote = async (vote: number) => {
        if (!post) return

        // Optimistic update
        const oldVote = post.userVote
        let upDelta = 0, downDelta = 0
        if (oldVote === 1) upDelta--
        if (oldVote === -1) downDelta--
        if (vote === 1) upDelta++
        if (vote === -1) downDelta++

        setPost({
            ...post,
            upvotes: post.upvotes + upDelta,
            downvotes: post.downvotes + downDelta,
            userVote: vote
        })

        await fetch(`/api/community/posts/${id}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote })
        })
    }

    const handleCommentVote = async (commentId: string, vote: number) => {
        if (!post) return

        // Optimistic update
        setPost({
            ...post,
            comments: post.comments.map(c => {
                if (c.id !== commentId) return c
                const oldVote = c.userVote
                let upDelta = 0, downDelta = 0
                if (oldVote === 1) upDelta--
                if (oldVote === -1) downDelta--
                if (vote === 1) upDelta++
                if (vote === -1) downDelta++
                return {
                    ...c,
                    upvotes: c.upvotes + upDelta,
                    downvotes: c.downvotes + downDelta,
                    userVote: vote
                }
            })
        })

        await fetch(`/api/community/comments/${commentId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote })
        })
    }

    const handleAddComment = async (body: string) => {
        const res = await fetch(`/api/community/posts/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body })
        })

        if (res.ok && post) {
            const comment = await res.json()
            setPost({
                ...post,
                comment_count: post.comment_count + 1,
                comments: [...post.comments, comment]
            })
        }
    }

    const handleDelete = async () => {
        if (!confirm('Delete this post?')) return
        const res = await fetch(`/api/community/posts/${id}`, { method: 'DELETE' })
        if (res.ok) {
            router.push('/dashboard/community')
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-[#22c1c3] animate-spin" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-[#d4e8ea] p-12 text-center">
                <h3 className="text-lg font-bold text-[#2c3e50] mb-2">Post not found</h3>
                <button
                    onClick={() => router.push('/dashboard/community')}
                    className="text-[#22c1c3] hover:underline text-sm"
                >
                    Back to Community
                </button>
            </div>
        )
    }

    const isOwner = post.user_id === user?.id

    return (
        <div className="space-y-4">
            {/* Back button */}
            <button
                onClick={() => router.push('/dashboard/community')}
                className="flex items-center gap-2 text-sm text-[#5a6c7d] hover:text-[#2c3e50] transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Community
            </button>

            {/* Post */}
            <div className="bg-white rounded-lg shadow-sm border border-[#d4e8ea] p-6">
                {/* Header */}
                <div className="flex items-center gap-2 text-xs text-[#95a5a6] mb-3">
                    <span className="font-semibold text-[#5a6c7d]">{post.username}</span>
                    <span>·</span>
                    <span>{timeAgo(post.created_at)}</span>
                    <span>·</span>
                    <span>{post.campus}</span>
                </div>

                {/* Flair + Title */}
                {post.flair && (
                    <div className="mb-2">
                        <FlairBadge flair={post.flair} />
                    </div>
                )}
                <h1 className="text-2xl font-bold text-[#2c3e50] mb-3">{post.title}</h1>

                {/* Body */}
                {post.body && (
                    <p className="text-[#5a6c7d] whitespace-pre-wrap mb-4 leading-relaxed">{post.body}</p>
                )}

                {/* Action bar */}
                <div className="flex items-center gap-3 pt-3 border-t border-[#f4fafb]">
                    <VoteButton
                        upvotes={post.upvotes}
                        downvotes={post.downvotes}
                        userVote={post.userVote}
                        onVote={handleVote}
                    />

                    <div className="flex items-center gap-1.5 text-[#95a5a6] text-sm px-2 py-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comment_count} Comments</span>
                    </div>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 text-[#95a5a6] text-sm px-2 py-1 rounded-full hover:bg-[#f4fafb] transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>

                    {isOwner && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 text-[#95a5a6] text-sm px-2 py-1 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors ml-auto"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Comments section */}
            <div className="bg-white rounded-lg shadow-sm border border-[#d4e8ea] p-6">
                <CommentSection
                    comments={post.comments}
                    currentUserId={user?.id || ''}
                    onAddComment={handleAddComment}
                    onVoteComment={handleCommentVote}
                />
            </div>
        </div>
    )
}
