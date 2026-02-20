'use client'

import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface VoteButtonProps {
    upvotes: number
    downvotes: number
    userVote: number // 1, -1, or 0
    onVote: (vote: number) => void
    size?: 'sm' | 'md'
}

export default function VoteButton({ upvotes, downvotes, userVote, onVote, size = 'md' }: VoteButtonProps) {
    const score = upvotes - downvotes
    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    const padding = size === 'sm' ? 'px-1 py-0.5' : 'px-1.5 py-1'

    return (
        <div className="flex items-center gap-0.5 rounded-full"
            style={{ background: 'var(--bg-lighter)' }}>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onVote(userVote === 1 ? 0 : 1)
                }}
                className={`${padding} rounded-full transition-colors`}
                style={{ color: userVote === 1 ? 'var(--brand-primary)' : 'var(--text-muted)' }}
                title="Upvote"
            >
                <ChevronUp className={iconSize} strokeWidth={userVote === 1 ? 3 : 2} />
            </button>
            <span className={`font-semibold min-w-[1.5rem] text-center ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
                style={{ color: userVote === 1 ? 'var(--brand-primary)' : userVote === -1 ? '#e74c3c' : 'var(--text-secondary)' }}>
                {score}
            </span>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onVote(userVote === -1 ? 0 : -1)
                }}
                className={`${padding} rounded-full transition-colors`}
                style={{ color: userVote === -1 ? '#e74c3c' : 'var(--text-muted)' }}
                title="Downvote"
            >
                <ChevronDown className={iconSize} strokeWidth={userVote === -1 ? 3 : 2} />
            </button>
        </div>
    )
}
