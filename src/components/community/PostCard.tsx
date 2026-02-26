'use client'

import React from 'react'
import Link from 'next/link'
import { MessageSquare, Share2, Trash2 } from 'lucide-react'
import VoteButton from './VoteButton'
import FlairBadge from './FlairBadge'
import { useToast } from '@/components/Toast'

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
    avatar_url?: string | null
}

interface PostCardProps {
    post: Post
    currentUserId: string
    onVote: (postId: string, vote: number) => void
    onDelete?: (postId: string) => void
    index?: number
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

export default function PostCard({ post, currentUserId, onVote, onDelete, index = 0 }: PostCardProps) {
    const isOwner = post.user_id === currentUserId
    const { toast } = useToast()

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        navigator.clipboard.writeText(`${window.location.origin}/dashboard/community/${post.id}`)
        toast('Link copied!', 'success')
    }

    return (
        <Link href={`/dashboard/community/${post.id}`}>
            <div
                className={`card p-5 hover:border-[var(--border-hover)] cursor-pointer animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                style={{ opacity: 0 }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                    {/* Avatar */}
                    {post.avatar_url ? (
                        <img src={post.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[var(--border-subtle)]" />
                    ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}>
                            {getInitials(post.username)}
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{post.username}</span>
                        <span>·</span>
                        <span>{timeAgo(post.created_at)}</span>
                    </div>
                    {post.flair && (
                        <div className="ml-auto">
                            <FlairBadge flair={post.flair} />
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold leading-snug mb-1" style={{ color: 'var(--text-primary)' }}>
                    {post.title}
                </h3>

                {/* Body preview */}
                {post.body && (
                    <p className="text-sm mb-4 line-clamp-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {post.body}
                    </p>
                )}

                {/* Action bar */}
                <div className="flex items-center gap-1 mt-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <VoteButton
                        upvotes={post.upvotes}
                        downvotes={post.downvotes}
                        userVote={post.userVote}
                        onVote={(vote) => onVote(post.id, vote)}
                    />

                    <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comment_count}</span>
                    </div>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                    </button>

                    {isOwner && onDelete && (
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onDelete(post.id)
                            }}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ml-auto"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'color-mix(in srgb, #ef4444 10%, transparent)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </Link>
    )
}
