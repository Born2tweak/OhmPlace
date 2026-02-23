'use client'

import React, { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
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
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleClose = () => {
        setTitle('')
        setBody('')
        setFlair(null)
        setError(null)
        onClose()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setLoading(true)
        setError(null)
        try {
            await onSubmit({ title: title.trim(), body: body.trim(), flair })
            setTitle('')
            setBody('')
            setFlair(null)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create post. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                style={{ background: 'var(--bg-card)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create a Post</h2>
                    <button
                        onClick={handleClose}
                        className="transition-colors hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error banner */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Flair selector */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Flair (optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FLAIRS.map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFlair(flair === f ? null : f)}
                                    className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
                                    style={{
                                        border: `1px solid ${flair === f ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                                        background: flair === f ? 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' : 'transparent',
                                        color: flair === f ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={200}
                            placeholder="What's on your mind?"
                            className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2"
                            style={{
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--bg-lighter)',
                                color: 'var(--text-primary)',
                            }}
                        />
                        <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{title.length}/200</p>
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Body (optional)
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            maxLength={5000}
                            rows={6}
                            placeholder="Add more details..."
                            className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 resize-none"
                            style={{
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--bg-lighter)',
                                color: 'var(--text-primary)',
                            }}
                        />
                        <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{body.length}/5000</p>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || loading}
                            className="px-6 py-2 text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 text-sm"
                            style={{ background: 'var(--brand-primary)' }}
                        >
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
