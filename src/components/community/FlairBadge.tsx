'use client'

import React from 'react'

const FLAIR_COLORS: Record<string, { bg: string; text: string }> = {
    'Rant/Vent': { bg: 'bg-red-100', text: 'text-red-700' },
    'Question': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'Discussion': { bg: 'bg-green-100', text: 'text-green-700' },
    'Buying': { bg: 'bg-purple-100', text: 'text-purple-700' },
    'Selling': { bg: 'bg-amber-100', text: 'text-amber-700' },
    'Project': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    'Advice': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    'Meme': { bg: 'bg-pink-100', text: 'text-pink-700' },
}

interface FlairBadgeProps {
    flair: string
}

export default function FlairBadge({ flair }: FlairBadgeProps) {
    const colors = FLAIR_COLORS[flair] || { bg: 'bg-gray-100', text: 'text-gray-700' }

    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
            {flair}
        </span>
    )
}

export const FLAIRS = Object.keys(FLAIR_COLORS)
