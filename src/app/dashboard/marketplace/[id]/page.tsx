'use client'

import React, { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, MessageSquare, Share2, MapPin, Tag, Clock, ShieldCheck, Loader2, ChevronLeft, ChevronRight, Trash2, CheckCircle } from 'lucide-react'
import type { Listing, ListingImage } from '@/types/database'
import { useToast } from '@/components/Toast'

export const dynamic = 'force-dynamic'

interface ListingWithImages extends Listing {
    images: ListingImage[]
    profiles?: {
        full_name: string
        avatar_url: string
        campus: string
    }
}

type CarouselTouchState = {
    startX: number | null
    startY: number | null
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const [listing, setListing] = useState<ListingWithImages | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [messaging, setMessaging] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [markingSold, setMarkingSold] = useState(false)
    const { toast } = useToast()
    const carouselTouchRef = useRef<CarouselTouchState>({ startX: null, startY: null })

    useEffect(() => {
        const fetchListing = async () => {
            const supabase = createClient()

            // Fetch listing with images
            const { data: listingData, error } = await supabase
                .from('listings')
                .select('*, images:listing_images(*)')
                .eq('id', id)
                .single()

            if (error || !listingData) {
                console.error('Error fetching listing:', error)
                setLoading(false)
                return
            }

            // Fetch seller profile (using metadata since profiles table access varies)
            // Ideally we'd join, but for now let's mock or use what we have. 
            // If profiles table exists and is public:
            // .select('*, images:listing_images(*), profiles(*)')

            // For now, attach images and set state
            // Sort images by order
            if (listingData.images) {
                listingData.images.sort((a: ListingImage, b: ListingImage) => a.order - b.order)
            }

            setListing(listingData as ListingWithImages)
            setLoading(false)
        }

        fetchListing()
    }, [id])

    const handleMessageSeller = async () => {
        if (!user || !listing) return

        if (user.id === listing.user_id) {
            toast("You can't message yourself!", 'error')
            return
        }

        setMessaging(true)

        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId: listing.user_id }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to start conversation')
            }

            router.push(`/dashboard/messages?id=${data.conversationId}`)
        } catch (error: unknown) {
            console.error('Error starting conversation:', error)
            const message = error instanceof Error ? error.message : 'Failed to start conversation'
            toast(message, 'error')
            setMessaging(false)
        }
    }

    const handleMarkAsSold = async () => {
        if (!listing) return
        setMarkingSold(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('listings')
            .update({ status: 'sold' })
            .eq('id', listing.id)
        if (error) {
            toast('Failed to mark as sold', 'error')
        } else {
            setListing({ ...listing, status: 'sold' })
            toast('Listing marked as sold!', 'success')
        }
        setMarkingSold(false)
    }

    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
            </div>
        )
    }

    if (!listing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Listing Not Found</h1>
                <p style={{ color: 'var(--text-secondary)' }}>This listing may have been removed or is no longer available.</p>
                <button
                    onClick={() => router.push('/dashboard/marketplace')}
                    className="px-6 py-2 rounded-full font-medium transition-colors"
                    style={{ background: 'var(--brand-primary)', color: '#ffffff' }}
                >
                    Browse Marketplace
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pb-12">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 mb-6 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Marketplace
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Swipeable Image Carousel */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-xl overflow-hidden relative"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>

                        {/* Swipeable image container */}
                        {listing.images && listing.images.length > 0 ? (
                            <div
                                className="relative aspect-video overflow-hidden touch-pan-y"
                                onTouchStart={(e) => {
                                    const touch = e.touches[0]
                                    carouselTouchRef.current = {
                                        startX: touch.clientX,
                                        startY: touch.clientY
                                    }
                                }}
                                onTouchEnd={(e) => {
                                    const { startX, startY } = carouselTouchRef.current
                                    if (startX == null || startY == null) return
                                    const endX = e.changedTouches[0].clientX
                                    const endY = e.changedTouches[0].clientY
                                    const diffX = startX - endX
                                    const diffY = startY - endY
                                    // Only swipe if horizontal movement > vertical
                                    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                                        if (diffX > 0 && selectedImageIndex < (listing.images?.length || 1) - 1) {
                                            setSelectedImageIndex(prev => prev + 1)
                                        } else if (diffX < 0 && selectedImageIndex > 0) {
                                            setSelectedImageIndex(prev => prev - 1)
                                        }
                                    }
                                    carouselTouchRef.current = { startX: null, startY: null }
                                }}
                            >
                                <div
                                    className="flex transition-transform duration-300 ease-out h-full"
                                    style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
                                >
                                    {listing.images.map((img, idx) => (
                                        <img
                                            key={img.id}
                                            src={img.image_url}
                                            alt={`${listing.title} - Image ${idx + 1}`}
                                            className="w-full h-full object-contain flex-shrink-0"
                                            draggable={false}
                                        />
                                    ))}
                                </div>

                                {/* Nav arrows (desktop) */}
                                {listing.images.length > 1 && (
                                    <>
                                        {selectedImageIndex > 0 && (
                                            <button
                                                onClick={() => setSelectedImageIndex(prev => prev - 1)}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition-all hidden sm:flex"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                        )}
                                        {selectedImageIndex < listing.images.length - 1 && (
                                            <button
                                                onClick={() => setSelectedImageIndex(prev => prev + 1)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition-all hidden sm:flex"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        )}
                                    </>
                                )}

                                {/* Image counter badge */}
                                {listing.images.length > 1 && (
                                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                                        {selectedImageIndex + 1} / {listing.images.length}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="aspect-video flex items-center justify-center">
                                <span className="text-4xl">🔌</span>
                            </div>
                        )}

                        {listing.status !== 'available' && (
                            <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-sm font-bold uppercase rounded-full backdrop-blur-sm">
                                {listing.status}
                            </div>
                        )}

                        {/* Dot indicators */}
                        {listing.images && listing.images.length > 1 && (
                            <div className="flex items-center justify-center gap-1.5 py-3">
                                {listing.images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${selectedImageIndex === idx
                                            ? 'w-5 bg-[var(--brand-primary)]'
                                            : 'w-1.5 bg-[var(--border-subtle)] hover:bg-[var(--text-muted)]'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl shadow-sm p-6 sticky top-6"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>

                        {/* Title & Price */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold mb-2 leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {listing.title}
                            </h1>
                            <div className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                                {formatPrice(listing.price)}
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-sm">
                                <Tag className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>{listing.category}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <ShieldCheck className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>
                                    Condition: <span className="font-semibold">{listing.condition === 'new' ? 'New' : listing.condition === 'used-good' ? 'Used - Good' : 'Used - Fair'}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Clock className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>Posted {formatDate(listing.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>On Campus Pickup</span>
                            </div>
                        </div>

                        {/* Action Custom Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleMessageSeller}
                                disabled={messaging || user?.id === listing.user_id}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: 'var(--brand-primary)' }}
                            >
                                {messaging ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <MessageSquare className="w-5 h-5" />
                                        Message Seller
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    const publicUrl = `${window.location.origin}/listing/${listing.id}`
                                    navigator.clipboard.writeText(publicUrl)
                                    toast('Link copied to clipboard!', 'success')
                                }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border border-transparent hover:border-current"
                                style={{ background: 'var(--bg-lighter)', color: 'var(--text-primary)' }}
                            >
                                <Share2 className="w-5 h-5" />
                                Share Listing
                            </button>
                            {user?.id === listing.user_id && (
                                <>
                                    {listing.status === 'available' && (
                                        <button
                                            onClick={handleMarkAsSold}
                                            disabled={markingSold}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }}
                                        >
                                            {markingSold ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" />Mark as Sold</>}
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return
                                            setDeleting(true)
                                            const supabase = createClient()
                                            try {
                                                await supabase.from('listing_images').delete().eq('listing_id', listing.id)
                                                await supabase.from('listings').delete().eq('id', listing.id)
                                                toast('Listing deleted', 'success')
                                                router.push('/dashboard/my-listings')
                                            } catch (err) {
                                                console.error('Error deleting listing:', err)
                                                toast('Failed to delete listing', 'error')
                                                setDeleting(false)
                                            }
                                        }}
                                        disabled={deleting}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                    >
                                        {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Trash2 className="w-5 h-5" />Delete Listing</>}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Seller Safety Tip */}
                        <div className="mt-8 p-4 rounded-lg" style={{ background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', border: '1px solid var(--border-subtle)' }}>
                            <div className="flex gap-3">
                                <div className="p-2 rounded-full flex-shrink-0 h-fit" style={{ background: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}>
                                    <ShieldCheck className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Safe Trading</h4>
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                        Always meet in a public, well-lit place on campus. Checking the item before paying is recommended.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom: Description */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl shadow-sm p-8"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Description</h2>
                        <div className="prose max-w-none" style={{ color: 'var(--text-secondary)' }}>
                            <p className="whitespace-pre-wrap leading-relaxed">
                                {listing.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
