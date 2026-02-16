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
        <div className="flex items-center gap-0.5 bg-[#f4fafb] rounded-full">
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onVote(userVote === 1 ? 0 : 1)
                }}
                className={`${padding} rounded-full transition-colors hover:bg-[#d4e8ea] ${
                    userVote === 1 ? 'text-[#22c1c3]' : 'text-[#95a5a6]'
                }`}
                title="Upvote"
            >
                <ChevronUp className={iconSize} strokeWidth={userVote === 1 ? 3 : 2} />
            </button>
            <span className={`font-semibold min-w-[1.5rem] text-center ${
                size === 'sm' ? 'text-xs' : 'text-sm'
            } ${
                userVote === 1 ? 'text-[#22c1c3]' : userVote === -1 ? 'text-[#e74c3c]' : 'text-[#5a6c7d]'
            }`}>
                {score}
            </span>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onVote(userVote === -1 ? 0 : -1)
                }}
                className={`${padding} rounded-full transition-colors hover:bg-[#d4e8ea] ${
                    userVote === -1 ? 'text-[#e74c3c]' : 'text-[#95a5a6]'
                }`}
                title="Downvote"
            >
                <ChevronDown className={iconSize} strokeWidth={userVote === -1 ? 3 : 2} />
            </button>
        </div>
    )
}
