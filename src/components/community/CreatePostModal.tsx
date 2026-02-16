'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { FLAIRS } from './FlairBadge'

interface CreatePostModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { title: string; body: string; flair: string | null }) => Promise<void>
}

export default function CreatePostModal({ isOpen, onClose, onSubmit }: CreatePostModalProps) {
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [flair, setFlair] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setLoading(true)
        try {
            await onSubmit({ title: title.trim(), body: body.trim(), flair })
            setTitle('')
            setBody('')
            setFlair(null)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#d4e8ea]">
                    <h2 className="text-lg font-bold text-[#2c3e50]">Create a Post</h2>
                    <button
                        onClick={onClose}
                        className="text-[#95a5a6] hover:text-[#2c3e50] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Flair selector */}
                    <div>
                        <label className="block text-sm font-medium text-[#5a6c7d] mb-2">
                            Flair (optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FLAIRS.map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFlair(flair === f ? null : f)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                        flair === f
                                            ? 'border-[#22c1c3] bg-[#22c1c3]/10 text-[#22c1c3]'
                                            : 'border-[#d4e8ea] text-[#5a6c7d] hover:border-[#22c1c3]'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-[#5a6c7d] mb-1">
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={200}
                            placeholder="What's on your mind?"
                            className="w-full px-4 py-2.5 border border-[#d4e8ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c1c3]/40 focus:border-[#22c1c3] text-[#2c3e50]"
                        />
                        <p className="text-xs text-[#95a5a6] mt-1 text-right">{title.length}/200</p>
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium text-[#5a6c7d] mb-1">
                            Body (optional)
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            maxLength={5000}
                            rows={6}
                            placeholder="Add more details..."
                            className="w-full px-4 py-2.5 border border-[#d4e8ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c1c3]/40 focus:border-[#22c1c3] text-[#2c3e50] resize-none"
                        />
                        <p className="text-xs text-[#95a5a6] mt-1 text-right">{body.length}/5000</p>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[#5a6c7d] hover:text-[#2c3e50] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || loading}
                            className="px-6 py-2 bg-[#22c1c3] text-white font-medium rounded-full hover:bg-[#1a9a9b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
