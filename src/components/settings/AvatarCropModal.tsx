'use client'

import React, { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { X, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react'

interface AvatarCropModalProps {
    imageUrl: string
    isOpen: boolean
    onClose: () => void
    onSave: (croppedBlob: Blob) => Promise<void>
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        // Only set crossOrigin for non-data URLs
        if (!src.startsWith('data:')) {
            img.crossOrigin = 'anonymous'
        }
        img.onload = () => resolve(img)
        img.onerror = (e) => reject(new Error('Failed to load image: ' + String(e)))
        img.src = src
    })
}

async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
    const image = await loadImage(imageSrc)

    const canvas = document.createElement('canvas')
    const outputSize = 256
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')

    if (!ctx) throw new Error('Could not get canvas context')

    ctx.drawImage(
        image,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, outputSize, outputSize
    )

    // Try webp first, fall back to png
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (blob) {
                    resolve(blob)
                } else {
                    // Fallback: try PNG
                    canvas.toBlob(
                        pngBlob => pngBlob ? resolve(pngBlob) : reject(new Error('Failed to create image blob')),
                        'image/png'
                    )
                }
            },
            'image/webp',
            0.85
        )
    })
}

export default function AvatarCropModal({ imageUrl, isOpen, onClose, onSave }: AvatarCropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedArea, setCroppedArea] = useState<Area | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedArea(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!croppedArea) return
        setSaving(true)
        setError(null)
        try {
            const blob = await getCroppedImg(imageUrl, croppedArea)
            console.log('[crop] Blob created, size:', blob.size, 'type:', blob.type)
            await onSave(blob)
        } catch (err) {
            console.error('[crop] Error:', err)
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Crop Profile Photo</h2>
                    <button onClick={onClose} className="hover:opacity-70 transition-opacity cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Crop area */}
                <div className="relative w-full" style={{ height: '320px', background: '#111' }}>
                    <Cropper
                        image={imageUrl}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                {/* Controls */}
                <div className="px-5 py-4 space-y-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Zoom */}
                    <div className="flex items-center gap-3">
                        <ZoomOut className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: 'var(--brand-primary)' }}
                        />
                        <ZoomIn className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    </div>

                    {/* Rotate */}
                    <div className="flex items-center justify-center">
                        <button
                            onClick={() => setRotation(r => (r + 90) % 360)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 cursor-pointer"
                            style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                            Rotate 90°
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-500 text-center">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 text-white font-semibold rounded-full text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
                            style={{ background: 'var(--brand-primary)' }}
                        >
                            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {saving ? 'Saving...' : 'Save Photo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
