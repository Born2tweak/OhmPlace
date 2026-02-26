'use client'

import React, { useState } from 'react'
import { Send, Reply, ChevronDown, ChevronUp } from 'lucide-react'
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
    parent_id: string | null
    avatar_url?: string | null
}

interface CommentSectionProps {
    comments: Comment[]
    currentUserId: string
    postAuthorId: string
    onAddComment: (body: string, parentId?: string) => Promise<void>
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

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function buildCommentTree(comments: Comment[]): (Comment & { replies: Comment[] })[] {
    const map = new Map<string, Comment & { replies: Comment[] }>()
    const roots: (Comment & { replies: Comment[] })[] = []

    // Initialize all comments with empty replies
    comments.forEach(c => map.set(c.id, { ...c, replies: [] }))

    // Build tree
    comments.forEach(c => {
        const node = map.get(c.id)!
        if (c.parent_id && map.has(c.parent_id)) {
            map.get(c.parent_id)!.replies.push(node)
        } else {
            roots.push(node)
        }
    })

    return roots
}

function CommentItem({
    comment,
    depth,
    currentUserId,
    postAuthorId,
    onVoteComment,
    onReply,
    sortBy,
}: {
    comment: Comment & { replies: Comment[] }
    depth: number
    currentUserId: string
    postAuthorId: string
    onVoteComment: (commentId: string, vote: number) => void
    onReply: (parentId: string) => void
    sortBy: 'best' | 'new'
}) {
    const [collapsed, setCollapsed] = useState(false)
    const isOP = comment.user_id === postAuthorId
    const maxDepth = 4

    const sortedReplies = [...comment.replies].sort((a, b) => {
        if (sortBy === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
    })

    return (
        <div className={depth > 0 ? 'pl-4 md:pl-6' : ''} style={depth > 0 ? { borderLeft: '2px solid var(--border-subtle)' } : {}}>
            <div className="py-3">
                {/* Header */}
                <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {comment.avatar_url ? (
                        <img src={comment.avatar_url} alt="avatar" className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-[var(--border-subtle)]" />
                    ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}>
                            {getInitials(comment.username)}
                        </div>
                    )}
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{comment.username}</span>
                    {isOP && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }}>
                            OP
                        </span>
                    )}
                    <span>·</span>
                    <span>{timeAgo(comment.created_at)}</span>
                    {comment.replies.length > 0 && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="flex items-center gap-1 ml-1 transition-colors hover:opacity-80"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                            <span>{collapsed ? 'Show' : 'Hide'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                        </button>
                    )}
                </div>

                {/* Body */}
                <p className="text-sm mb-2 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{comment.body}</p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <VoteButton
                        upvotes={comment.upvotes}
                        downvotes={comment.downvotes}
                        userVote={comment.userVote}
                        onVote={(vote) => onVoteComment(comment.id, vote)}
                        size="sm"
                    />
                    {depth < maxDepth && (
                        <button
                            onClick={() => onReply(comment.id)}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:opacity-80"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <Reply className="w-3 h-3" />
                            Reply
                        </button>
                    )}
                </div>
            </div>

            {/* Nested replies */}
            {!collapsed && sortedReplies.length > 0 && (
                <div>
                    {sortedReplies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply as Comment & { replies: Comment[] }}
                            depth={depth + 1}
                            currentUserId={currentUserId}
                            postAuthorId={postAuthorId}
                            onVoteComment={onVoteComment}
                            onReply={onReply}
                            sortBy={sortBy}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function CommentSection({ comments, currentUserId, postAuthorId, onAddComment, onVoteComment }: CommentSectionProps) {
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [sortBy, setSortBy] = useState<'best' | 'new'>('best')
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const [replyLoading, setReplyLoading] = useState(false)

    const tree = buildCommentTree(
        [...comments].sort((a, b) => {
            if (sortBy === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
        })
    )

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

    const handleReplySubmit = async (parentId: string) => {
        if (!replyText.trim() || replyLoading) return

        setReplyLoading(true)
        try {
            await onAddComment(replyText.trim(), parentId)
            setReplyText('')
            setReplyingTo(null)
        } finally {
            setReplyLoading(false)
        }
    }

    const handleReplyClick = (parentId: string) => {
        setReplyingTo(replyingTo === parentId ? null : parentId)
        setReplyText('')
    }

    return (
        <div>
            {/* Top-level comment input */}
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

            {/* Threaded comments */}
            <div className="space-y-1">
                {tree.map((comment) => (
                    <div key={comment.id}>
                        <CommentItem
                            comment={comment}
                            depth={0}
                            currentUserId={currentUserId}
                            postAuthorId={postAuthorId}
                            onVoteComment={onVoteComment}
                            onReply={handleReplyClick}
                            sortBy={sortBy}
                        />
                        {/* Inline reply form */}
                        {replyingTo === comment.id && (
                            <div className="pl-4 md:pl-6 pb-3" style={{ borderLeft: '2px solid var(--border-subtle)' }}>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Reply to ${comment.username}...`}
                                        maxLength={2000}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleReplySubmit(comment.id)
                                            }
                                            if (e.key === 'Escape') {
                                                setReplyingTo(null)
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 text-sm"
                                        style={{
                                            border: '1px solid var(--border-subtle)',
                                            background: 'var(--bg-lighter)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <button
                                        onClick={() => handleReplySubmit(comment.id)}
                                        disabled={!replyText.trim() || replyLoading}
                                        className="px-3 py-2 text-white rounded-lg disabled:opacity-50 text-sm transition-colors"
                                        style={{ background: 'var(--brand-primary)' }}
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="px-3 py-2 rounded-lg text-sm transition-colors"
                                        style={{ color: 'var(--text-muted)', background: 'var(--bg-lighter)' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Show reply forms for nested comments too */}
                        {renderNestedReplyForms(comment.replies as (Comment & { replies: Comment[] })[])}
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

    function renderNestedReplyForms(replies: (Comment & { replies: Comment[] })[]) {
        return replies.map(reply => (
            <React.Fragment key={`reply-form-${reply.id}`}>
                {replyingTo === reply.id && (
                    <div className="pl-8 md:pl-12 pb-3" style={{ borderLeft: '2px solid var(--border-subtle)', marginLeft: '1rem' }}>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${reply.username}...`}
                                maxLength={2000}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleReplySubmit(reply.id)
                                    }
                                    if (e.key === 'Escape') {
                                        setReplyingTo(null)
                                    }
                                }}
                                className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 text-sm"
                                style={{
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-lighter)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                            <button
                                onClick={() => handleReplySubmit(reply.id)}
                                disabled={!replyText.trim() || replyLoading}
                                className="px-3 py-2 text-white rounded-lg disabled:opacity-50 text-sm transition-colors"
                                style={{ background: 'var(--brand-primary)' }}
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="px-3 py-2 rounded-lg text-sm transition-colors"
                                style={{ color: 'var(--text-muted)', background: 'var(--bg-lighter)' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                {reply.replies && renderNestedReplyForms(reply.replies as (Comment & { replies: Comment[] })[])}
            </React.Fragment>
        ))
    }
}
