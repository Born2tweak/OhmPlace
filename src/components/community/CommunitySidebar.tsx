'use client'

import React, { useState } from 'react'
import { Users, Plus, Shield, BookOpen, ChevronDown, ChevronUp, Sparkles, Calendar, MessageSquare } from 'lucide-react'
import FlairBadge, { FLAIRS } from './FlairBadge'

interface CommunitySidebarProps {
    campus: string
    memberCount?: number
    activeNow?: number
    postsToday?: number
    onCreatePost: () => void
    selectedFlair: string | null
    onFlairFilter: (flair: string | null) => void
}

const COMMUNITY_RULES = [
    { title: 'Be respectful & civil', description: 'No personal attacks, hate speech, or harassment.' },
    { title: 'Stay on topic', description: 'Posts should be relevant to your campus community.' },
    { title: 'No spam or self-promotion', description: 'Excessive promotion of products or services is not allowed.' },
    { title: 'No academic dishonesty', description: 'Do not share exam answers, plagiarize, or facilitate cheating.' },
    { title: 'Protect privacy', description: "Don't share personal information about others without consent." },
]

export default function CommunitySidebar({
    campus,
    memberCount = 0,
    activeNow = 0,
    postsToday = 0,
    onCreatePost,
    selectedFlair,
    onFlairFilter
}: CommunitySidebarProps) {
    const [rulesExpanded, setRulesExpanded] = useState(false)

    const campusName = campus ? campus.split('.')[0].charAt(0).toUpperCase() + campus.split('.')[0].slice(1) : 'Campus'

    return (
        <div className="space-y-4">
            {/* Community Info Card */}
            <div className="bg-white rounded-xl border border-[#e2ecee] overflow-hidden">
                {/* Banner */}
                <div className="h-20 bg-gradient-to-r from-[#22c1c3] via-[#1aadaf] to-[#15868e] relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-40"></div>
                </div>

                {/* Icon overlapping banner */}
                <div className="px-4 -mt-6 pb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#22c1c3] to-[#15868e] rounded-full flex items-center justify-center border-4 border-white shadow-md mb-2">
                        <Users className="w-7 h-7 text-white" />
                    </div>

                    <h2 className="text-lg font-bold text-[#1a1a1b]">c/{campusName}</h2>
                    <p className="text-xs text-[#878a8c] mb-3">{campus}</p>

                    <p className="text-sm text-[#5a6c7d] mb-4 leading-relaxed">
                        Welcome to the {campusName} community! Connect with fellow students, share experiences, and stay updated.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 py-3 border-t border-[#edeff1] mb-3">
                        <div className="text-center">
                            <div className="text-base font-bold text-[#1a1a1b]">
                                {memberCount >= 1000 ? `${(memberCount / 1000).toFixed(1)}K` : memberCount || '--'}
                            </div>
                            <div className="text-[10px] text-[#878a8c] font-medium">Members</div>
                        </div>
                        <div className="text-center">
                            <div className="text-base font-bold text-[#1a1a1b] flex items-center justify-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                {activeNow || '--'}
                            </div>
                            <div className="text-[10px] text-[#878a8c] font-medium">Online</div>
                        </div>
                        <div className="text-center">
                            <div className="text-base font-bold text-[#1a1a1b]">{postsToday || '--'}</div>
                            <div className="text-[10px] text-[#878a8c] font-medium">Today</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#878a8c] mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created Feb 2026</span>
                    </div>

                    <button
                        onClick={onCreatePost}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#22c1c3] text-white font-bold rounded-full hover:bg-[#1a9a9b] transition-all duration-200 text-sm hover:shadow-md active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        Create Post
                    </button>
                </div>
            </div>

            {/* Flair Filter */}
            <div className="bg-white rounded-xl border border-[#e2ecee] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#edeff1]">
                    <h3 className="text-xs font-bold text-[#878a8c] uppercase tracking-wider">Filter by Flair</h3>
                </div>
                <div className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => onFlairFilter(null)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${selectedFlair === null
                                ? 'border-[#22c1c3] bg-[#22c1c3]/10 text-[#22c1c3]'
                                : 'border-[#edeff1] text-[#878a8c] hover:border-[#22c1c3]/50'
                                }`}
                        >
                            All
                        </button>
                        {FLAIRS.map((f) => (
                            <button
                                key={f}
                                onClick={() => onFlairFilter(selectedFlair === f ? null : f)}
                                className={`transition-all duration-200 ${selectedFlair === f ? 'scale-105' : 'opacity-75 hover:opacity-100'}`}
                            >
                                <FlairBadge flair={f} size="sm" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Community Rules */}
            <div className="bg-white rounded-xl border border-[#e2ecee] overflow-hidden">
                <button
                    onClick={() => setRulesExpanded(!rulesExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-[#edeff1] hover:bg-[#f8fcfc] transition-colors"
                >
                    <h3 className="text-xs font-bold text-[#878a8c] uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        c/{campusName} Rules
                    </h3>
                    {rulesExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#878a8c]" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-[#878a8c]" />
                    )}
                </button>

                <div className={`transition-all duration-300 overflow-hidden ${rulesExpanded ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="p-3 space-y-0">
                        {COMMUNITY_RULES.map((rule, i) => (
                            <div
                                key={i}
                                className="flex gap-3 py-2.5 border-b border-[#edeff1] last:border-b-0"
                            >
                                <span className="text-sm font-bold text-[#1a1a1b] min-w-[1.25rem]">{i + 1}</span>
                                <div>
                                    <p className="text-sm font-medium text-[#1a1a1b]">{rule.title}</p>
                                    <p className="text-xs text-[#878a8c] mt-0.5">{rule.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Community Bookmarks */}
            <div className="bg-white rounded-xl border border-[#e2ecee] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#edeff1]">
                    <h3 className="text-xs font-bold text-[#878a8c] uppercase tracking-wider">Community Bookmarks</h3>
                </div>
                <div className="p-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#5a6c7d] rounded-lg hover:bg-[#f4fafb] transition-colors text-left">
                        <BookOpen className="w-4 h-4 text-[#22c1c3]" />
                        FAQ
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#5a6c7d] rounded-lg hover:bg-[#f4fafb] transition-colors text-left">
                        <Sparkles className="w-4 h-4 text-[#22c1c3]" />
                        Resources
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#5a6c7d] rounded-lg hover:bg-[#f4fafb] transition-colors text-left">
                        <MessageSquare className="w-4 h-4 text-[#22c1c3]" />
                        Weekly Discussion
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-[#b0bec5] py-2">
                <p>OhmPlace Community © 2026</p>
                <p className="mt-0.5">Built with 💎 for campus connections</p>
            </div>
        </div>
    )
}
