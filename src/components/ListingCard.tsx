'use client'

import React from 'react'
import type { Listing, ListingImage } from '@/types/database'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface ListingWithImages extends Listing {
    images: ListingImage[]
}

interface ListingCardProps {
    listing: ListingWithImages
    actionLabel?: string
    onAction?: (listing: ListingWithImages) => void
    linkTo?: string
    index?: number
}

export default function ListingCard({
    listing,
    actionLabel,
    onAction,
    linkTo,
    index = 0
}: ListingCardProps) {
    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const coverImage = listing.images.length > 0 ? listing.images[0].image_url : null
    const isPromoted = listing.promoted && listing.promoted_until && new Date(listing.promoted_until) > new Date()

    const conditionLabel = listing.condition === 'new' ? 'New' : listing.condition === 'used-good' ? 'Used - Good' : 'Used - Fair'

    const CardContent = () => (
        <div
            className={`card h-full flex flex-col overflow-hidden animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
            style={{ opacity: 0, background: 'var(--bg-card)' }}
        >
            {/* Image */}
            <div className="aspect-square w-full relative overflow-hidden" style={{ background: 'var(--bg-lighter)' }}>
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                        <span className="text-4xl">🔌</span>
                    </div>
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isPromoted && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm"
                            style={{ background: 'rgba(245, 158, 11, 0.9)', color: '#fff' }}>
                            <Zap className="w-3 h-3" />
                            Promoted
                        </div>
                    )}
                </div>
                {listing.status !== 'available' && (
                    <div className="absolute top-3 right-3 bg-gray-900/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        {listing.status}
                    </div>
                )}
                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-base leading-snug line-clamp-2 flex-1" style={{ color: 'var(--text-primary)' }}>
                        {listing.title}
                    </h3>
                    <span className="font-extrabold text-lg whitespace-nowrap" style={{ color: 'var(--brand-primary)' }}>
                        {formatPrice(listing.price)}
                    </span>
                </div>

                <div className="flex gap-1.5 mb-3 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase"
                        style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }}>
                        {listing.category}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{ background: 'var(--bg-lighter)', color: 'var(--text-muted)' }}>
                        {conditionLabel}
                    </span>
                </div>

                {listing.description && (
                    <p className="text-sm line-clamp-2 mb-3 flex-1" style={{ color: 'var(--text-secondary)' }}>
                        {listing.description}
                    </p>
                )}

                <div className="mt-auto pt-3 flex justify-between items-center text-xs"
                    style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <span>Posted {formatDate(listing.created_at)}</span>
                    {onAction && actionLabel && (
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                onAction(listing)
                            }}
                            className="font-semibold transition-colors"
                            style={{ color: 'var(--brand-primary)' }}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )

    if (linkTo) {
        return (
            <Link href={linkTo} className="block group h-full">
                <CardContent />
            </Link>
        )
    }

    return <CardContent />
}
