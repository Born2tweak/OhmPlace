'use client'

import React from 'react'
import type { Listing, ListingImage } from '@/types/database'
import Link from 'next/link'

interface ListingWithImages extends Listing {
    images: ListingImage[]
}

interface ListingCardProps {
    listing: ListingWithImages
    actionLabel?: string
    onAction?: (listing: ListingWithImages) => void
    linkTo?: string
}

export default function ListingCard({
    listing,
    actionLabel,
    onAction,
    linkTo
}: ListingCardProps) {
    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const coverImage = listing.images.length > 0 ? listing.images[0].image_url : null

    const CardContent = () => (
        <div className="card h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300"
            style={{ background: 'var(--bg-card)' }}>
            {/* Image */}
            <div className="aspect-video w-full relative" style={{ background: 'var(--bg-lighter)' }}>
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                        <span className="text-3xl">🔌</span>
                    </div>
                )}
                {listing.status !== 'available' && (
                    <div className="absolute top-2 right-2 bg-gray-900/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                        {listing.status}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight line-clamp-1 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {listing.title}
                    </h3>
                    <span className="font-bold text-lg whitespace-nowrap ml-2" style={{ color: 'var(--brand-primary)' }}>
                        {formatPrice(listing.price)}
                    </span>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'var(--bg-lighter)', color: 'var(--brand-accent)' }}>
                        {listing.category}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'var(--bg-lighter)', color: 'var(--text-secondary)' }}>
                        {listing.condition === 'new' ? 'New' : listing.condition === 'used-good' ? 'Used - Good' : 'Used - Fair'}
                    </span>
                </div>

                <p className="text-sm line-clamp-2 mb-4 flex-1" style={{ color: 'var(--text-secondary)' }}>
                    {listing.description || 'No description provided.'}
                </p>

                <div className="mt-auto pt-4 flex justify-between items-center text-xs"
                    style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <span>Posted {formatDate(listing.created_at)}</span>
                    {onAction && actionLabel && (
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                onAction(listing)
                            }}
                            className="font-medium transition-colors"
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
