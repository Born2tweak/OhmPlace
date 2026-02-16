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
        // Best = highest net score
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
                        className="flex-1 px-4 py-2.5 border border-[#d4e8ea] rounded-full focus:outline-none focus:ring-2 focus:ring-[#22c1c3]/40 focus:border-[#22c1c3] text-sm text-[#2c3e50]"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || loading}
                        className="px-4 py-2.5 bg-[#22c1c3] text-white rounded-full hover:bg-[#1a9a9b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* Sort + count */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#5a6c7d] font-medium">
                    {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </span>
                <div className="flex items-center gap-1 text-sm">
                    <span className="text-[#95a5a6]">Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'best' | 'new')}
                        className="text-[#5a6c7d] font-medium bg-transparent border-none focus:outline-none cursor-pointer"
                    >
                        <option value="best">Best</option>
                        <option value="new">New</option>
                    </select>
                </div>
            </div>

            {/* Comments list */}
            <div className="space-y-1">
                {sortedComments.map((comment) => (
                    <div key={comment.id} className="py-3 border-b border-[#f4fafb] last:border-b-0">
                        <div className="flex items-center gap-2 text-xs text-[#95a5a6] mb-1.5">
                            <span className="font-semibold text-[#5a6c7d]">{comment.username}</span>
                            {comment.user_id === currentUserId && (
                                <span className="px-1.5 py-0.5 bg-[#22c1c3]/10 text-[#22c1c3] rounded text-[10px] font-bold">
                                    OP
                                </span>
                            )}
                            <span>·</span>
                            <span>{timeAgo(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-[#2c3e50] mb-2 whitespace-pre-wrap">{comment.body}</p>
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
                    <p className="text-center text-sm text-[#95a5a6] py-8">
                        No comments yet. Be the first to share your thoughts!
                    </p>
                )}
            </div>
        </div>
    )
}
