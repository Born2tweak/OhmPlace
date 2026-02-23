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
    const [messaging, setMessaging] = useState(false)

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

    const handleMessageAuthor = async () => {
        if (!user || !post) return

        if (user.id === post.user_id) {
            alert("You can't message yourself!")
            return
        }

        setMessaging(true)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        try {
            // Check for existing conversation (bidirectional check)
            const { data: c1, error: e1 } = await supabase
                .from('conversations')
                .select('*')
                .match({ participant_1: user.id, participant_2: post.user_id })
                .maybeSingle()

            const { data: c2, error: e2 } = await supabase
                .from('conversations')
                .select('*')
                .match({ participant_1: post.user_id, participant_2: user.id })
                .maybeSingle()

            if (e1 && e1.code !== 'PGRST116') throw e1
            if (e2 && e2.code !== 'PGRST116') throw e2

            let conversationId = c1?.id || c2?.id

            if (!conversationId) {
                // Create new conversation
                const { data: newConvo, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        participant_1: user.id,
                        participant_2: post.user_id,
                        last_message_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (createError) throw createError
                conversationId = newConvo.id
            }

            // Redirect to messages
            router.push(`/dashboard/messages?id=${conversationId}`)
        } catch (error) {
            console.error('Error starting conversation:', error)
            alert(`Failed to start conversation: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
            setMessaging(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="rounded-lg shadow-sm p-12 text-center"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Post not found</h3>
                <button
                    onClick={() => router.push('/dashboard/community')}
                    className="hover:underline text-sm"
                    style={{ color: 'var(--brand-primary)' }}
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
                className="flex items-center gap-2 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Community
            </button>

            {/* Post */}
            <div className="rounded-lg shadow-sm p-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                {/* Header */}
                <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{post.username}</span>
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
                <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{post.title}</h1>

                {/* Body */}
                {post.body && (
                    <p className="whitespace-pre-wrap mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{post.body}</p>
                )}

                {/* Action bar */}
                <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--bg-lighter)' }}>
                    <VoteButton
                        upvotes={post.upvotes}
                        downvotes={post.downvotes}
                        userVote={post.userVote}
                        onVote={handleVote}
                    />

                    <div className="flex items-center gap-1.5 text-sm px-2 py-1"
                        style={{ color: 'var(--text-muted)' }}>
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comment_count} Comments</span>
                    </div>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 text-sm px-2 py-1 rounded-full transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                    {!isOwner && (
                        <button
                            onClick={handleMessageAuthor}
                            disabled={messaging}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium transition-colors ml-auto"
                            style={{
                                background: 'var(--brand-primary)',
                                color: '#ffffff',
                                opacity: messaging ? 0.7 : 1,
                                cursor: messaging ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {messaging ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <MessageSquare className="w-4 h-4" />
                                    Message
                                </>
                            )}
                        </button>
                    )}

                    {isOwner && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 text-sm px-2 py-1 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors ml-auto"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Comments section */}
            <div className="rounded-lg shadow-sm p-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
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
