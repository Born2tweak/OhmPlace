'use client'

import React from 'react'
import Link from 'next/link'
import { MessageSquare, Share2, Trash2 } from 'lucide-react'
import VoteButton from './VoteButton'
import FlairBadge from './FlairBadge'

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

interface PostCardProps {
    post: Post
    currentUserId: string
    onVote: (postId: string, vote: number) => void
    onDelete?: (postId: string) => void
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

export default function PostCard({ post, currentUserId, onVote, onDelete }: PostCardProps) {
    const isOwner = post.user_id === currentUserId

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        navigator.clipboard.writeText(`${window.location.origin}/dashboard/community/${post.id}`)
    }

    return (
        <Link href={`/dashboard/community/${post.id}`}>
            <div className="bg-white rounded-lg shadow-sm border border-[#d4e8ea] p-4 hover:shadow-md transition-shadow cursor-pointer">
                {/* Header */}
                <div className="flex items-center gap-2 text-xs text-[#95a5a6] mb-2">
                    <span className="font-semibold text-[#5a6c7d]">{post.username}</span>
                    <span>·</span>
                    <span>{timeAgo(post.created_at)}</span>
                </div>

                {/* Flair + Title */}
                <div className="mb-2">
                    {post.flair && (
                        <div className="mb-1.5">
                            <FlairBadge flair={post.flair} />
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-[#2c3e50] leading-snug">{post.title}</h3>
                </div>

                {/* Body preview */}
                {post.body && (
                    <p className="text-sm text-[#5a6c7d] mb-3 line-clamp-3">{post.body}</p>
                )}

                {/* Action bar */}
                <div className="flex items-center gap-3 mt-2">
                    <VoteButton
                        upvotes={post.upvotes}
                        downvotes={post.downvotes}
                        userVote={post.userVote}
                        onVote={(vote) => onVote(post.id, vote)}
                    />

                    <div className="flex items-center gap-1.5 text-[#95a5a6] text-sm px-2 py-1 rounded-full hover:bg-[#f4fafb] transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comment_count}</span>
                    </div>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 text-[#95a5a6] text-sm px-2 py-1 rounded-full hover:bg-[#f4fafb] transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                    </button>

                    {isOwner && onDelete && (
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onDelete(post.id)
                            }}
                            className="flex items-center gap-1.5 text-[#95a5a6] text-sm px-2 py-1 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors ml-auto"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </Link>
    )
}
