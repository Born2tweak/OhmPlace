'use client'

import React, { useState } from 'react'
import { Send } from 'lucide-react'
import VoteButton from './VoteButton'

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

interface CommentSectionProps {
    comments: Comment[]
    currentUserId: string
    onAddComment: (body: string) => Promise<void>
    onVoteComment: (commentId: string, vote: number) => void
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

export default function CommentSection({ comments, currentUserId, onAddComment, onVoteComment }: CommentSectionProps) {
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [sortBy, setSortBy] = useState<'best' | 'new'>('best')

    const sortedComments = [...comments].sort((a, b) => {
        if (sortBy === 'new') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || loading) return

        setLoading(true)
        try {
            await onAddComment(newComment.trim())
            setNewComment('')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Comment input */}
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Join the conversation..."
                        maxLength={2000}
                        className="flex-1 px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 text-sm"
                        style={{
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-lighter)',
                            color: 'var(--text-primary)',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || loading}
                        className="px-4 py-2.5 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ background: 'var(--brand-primary)' }}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* Sort + count */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </span>
                <div className="flex items-center gap-1 text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'best' | 'new')}
                        className="font-medium bg-transparent border-none focus:outline-none cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <option value="best">Best</option>
                        <option value="new">New</option>
                    </select>
                </div>
            </div>

            {/* Comments list */}
            <div className="space-y-1">
                {sortedComments.map((comment) => (
                    <div key={comment.id} className="py-3 last:border-b-0"
                        style={{ borderBottom: '1px solid var(--bg-lighter)' }}>
                        <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{comment.username}</span>
                            {comment.user_id === currentUserId && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                    style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }}>
                                    OP
                                </span>
                            )}
                            <span>·</span>
                            <span>{timeAgo(comment.created_at)}</span>
                        </div>
                        <p className="text-sm mb-2 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{comment.body}</p>
                        <VoteButton
                            upvotes={comment.upvotes}
                            downvotes={comment.downvotes}
                            userVote={comment.userVote}
                            onVote={(vote) => onVoteComment(comment.id, vote)}
                            size="sm"
                        />
                    </div>
                ))}

                {comments.length === 0 && (
                    <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
                        No comments yet. Be the first to share your thoughts!
                    </p>
                )}
            </div>
        </div>
    )
}
