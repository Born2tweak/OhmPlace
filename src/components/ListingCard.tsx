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
        <div className="card h-full flex flex-col overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300">
            {/* Image */}
            <div className="aspect-video w-full bg-gray-100 relative">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <span className="text-3xl">🔌</span>
                    </div>
                )}
                {/* Status Badge */}
                {listing.status !== 'available' && (
                    <div className="absolute top-2 right-2 bg-gray-900/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                        {listing.status}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#2c3e50] text-lg leading-tight line-clamp-1 group-hover:text-[#22c1c3] transition-colors">
                        {listing.title}
                    </h3>
                    <span className="text-[#22c1c3] font-bold text-lg whitespace-nowrap ml-2">
                        {formatPrice(listing.price)}
                    </span>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e8f4f5] text-[#15868e]">
                        {listing.category}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {listing.condition === 'new' ? 'New' : listing.condition === 'used-good' ? 'Used - Good' : 'Used - Fair'}
                    </span>
                </div>

                <p className="text-sm text-[#5a6c7d] line-clamp-2 mb-4 flex-1">
                    {listing.description || 'No description provided.'}
                </p>

                <div className="mt-auto pt-4 border-t border-[#d4e8ea] flex justify-between items-center text-xs text-[#95a5a6]">
                    <span>Posted {formatDate(listing.created_at)}</span>
                    {onAction && actionLabel && (
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                onAction(listing)
                            }}
                            className="text-[#22c1c3] font-medium hover:text-[#1a9a9b] transition-colors"
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
