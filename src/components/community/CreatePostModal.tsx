'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from '@clerk/nextjs'
import { X, AlertCircle, ImagePlus, Loader2 } from 'lucide-react'
import { FLAIRS } from './FlairBadge'
import { uploadPostImage } from '@/lib/supabase/storage'

interface CreatePostModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { title: string; body: string; flair: string | null; image_url?: string | null }) => Promise<void>
}

export default function CreatePostModal({ isOpen, onClose, onSubmit }: CreatePostModalProps) {
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [flair, setFlair] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [closing, setClosing] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { session } = useSession()

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    if (!isOpen) return null

    const resetForm = () => {
        setTitle('')
        setBody('')
        setFlair(null)
        setImageFile(null)
        setImagePreview(null)
        setError(null)
    }

    const handleClose = () => {
        if (isMobile) {
            setClosing(true)
            setTimeout(() => {
                setClosing(false)
                resetForm()
                onClose()
            }, 300)
        } else {
            resetForm()
            onClose()
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB')
            return
        }

        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Only JPEG, PNG, and WebP images are allowed')
            return
        }

        setImageFile(file)
        setError(null)
        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target?.result as string)
        reader.readAsDataURL(file)
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setLoading(true)
        setError(null)
        try {
            let image_url: string | null = null

            // Upload image first if selected
            if (imageFile) {
                const tempId = crypto.randomUUID()
                const token = await session?.getToken({ template: 'supabase' })
                image_url = await uploadPostImage(imageFile, tempId, token || undefined)
            }

            await onSubmit({ title: title.trim(), body: body.trim(), flair, image_url })
            resetForm()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create post. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Shared form content
    const formContent = (
        <>
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
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
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
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
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
                    rows={isMobile ? 4 : 6}
                    placeholder="Add more details..."
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 resize-none"
                    style={{
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-lighter)',
                        color: 'var(--text-primary)',
                    }}
                />
                <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{body.length}/5000</p>
            </div>

            {/* Image upload */}
            <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Image (optional)
                </label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                />
                {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                        <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                            style={{ background: 'rgba(0,0,0,0.6)' }}
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl transition-all hover:opacity-80"
                        style={{
                            border: '2px dashed var(--border-subtle)',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-lighter)',
                        }}
                    >
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-sm font-medium">Add an image</span>
                    </button>
                )}
            </div>
        </>
    )

    // Bottom sheet on mobile
    if (isMobile) {
        return (
            <div
                className={`fixed inset-0 z-50 ${closing ? '' : 'bottom-sheet-overlay'}`}
                style={{ background: 'rgba(0,0,0,0.5)' }}
                onClick={handleClose}
            >
                <div
                    className={`fixed bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${closing ? '' : 'bottom-sheet-content'}`}
                    style={{
                        background: 'var(--bg-card)',
                        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                        animation: closing ? 'bottomSheetDown 0.3s ease-in forwards' : undefined,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-subtle)' }} />
                    </div>

                    <div className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create a Post</h2>
                        <button onClick={handleClose} className="p-1" style={{ color: 'var(--text-muted)' }}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {formContent}
                        <button
                            type="submit"
                            disabled={!title.trim() || loading}
                            className="w-full py-3.5 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
                            style={{ background: 'var(--brand-primary)' }}
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : 'Post'}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // Desktop: centered modal
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                style={{ background: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create a Post</h2>
                    <button onClick={handleClose} className="transition-colors hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {formContent}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium transition-colors"
                            style={{ color: 'var(--text-secondary)' }}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || loading}
                            className="px-6 py-2 text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 text-sm flex items-center gap-2"
                            style={{ background: 'var(--brand-primary)' }}
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
