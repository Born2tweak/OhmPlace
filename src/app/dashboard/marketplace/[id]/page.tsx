'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, MessageSquare, Share2, MapPin, Tag, Clock, ShieldCheck, Truck, Loader2 } from 'lucide-react'
import type { Listing, ListingImage } from '@/types/database'

export const dynamic = 'force-dynamic'

interface ListingWithImages extends Listing {
    images: ListingImage[]
    profiles?: {
        full_name: string
        avatar_url: string
        campus: string
    }
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const [listing, setListing] = useState<ListingWithImages | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [messaging, setMessaging] = useState(false)

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
            alert("You can't message yourself!")
            return
        }

        setMessaging(true)
        const supabase = createClient()

        try {
            // Check for existing conversation (bidirectional check)
            const { data: c1, error: e1 } = await supabase
                .from('conversations')
                .select('*')
                .match({ participant_1: user.id, participant_2: listing.user_id })
                .maybeSingle()

            const { data: c2, error: e2 } = await supabase
                .from('conversations')
                .select('*')
                .match({ participant_1: listing.user_id, participant_2: user.id })
                .maybeSingle()

            if (e1 && e1.code !== 'PGRST116') throw e1
            if (e2 && e2.code !== 'PGRST116') throw e2

            let conversationId = c1?.id || c2?.id

            if (!conversationId) {
                // Create new conversation
                const { data: newConvo, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        participant_1: user.id,
                        participant_2: listing.user_id,
                        last_message_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (createError) throw createError
                conversationId = newConvo.id
            }

            // Redirect to messages
            router.push(`/dashboard/messages?id=${conversationId}`)
        } catch (error: any) {
            console.error('Error starting conversation:', error)
            alert(`Failed to start conversation: ${error.message || JSON.stringify(error)}`)
            setMessaging(false)
        }
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
                {/* Left Column: Images */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video rounded-xl overflow-hidden relative"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        {listing.images && listing.images.length > 0 ? (
                            <img
                                src={listing.images[selectedImageIndex].image_url}
                                alt={listing.title}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-4xl">🔌</span>
                            </div>
                        )}
                        {listing.status !== 'available' && (
                            <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-sm font-bold uppercase rounded-full backdrop-blur-sm">
                                {listing.status}
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {listing.images && listing.images.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {listing.images.map((img, idx) => (
                                <button
                                    key={img.id}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'ring-2 ring-offset-2' : 'opacity-70 hover:opacity-100'
                                        }`}
                                    style={{
                                        borderColor: selectedImageIndex === idx ? 'var(--brand-primary)' : 'transparent',
                                        // outlineColor: selectedImageIndex === idx ? 'var(--brand-primary)' : 'transparent'
                                    }}
                                >
                                    <img src={img.image_url} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
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
                                    navigator.clipboard.writeText(window.location.href)
                                    alert('Link copied to clipboard!')
                                }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border border-transparent hover:border-current"
                                style={{ background: 'var(--bg-lighter)', color: 'var(--text-primary)' }}
                            >
                                <Share2 className="w-5 h-5" />
                                Share Listing
                            </button>
                        </div>

                        {/* Seller Safety Tip */}
                        <div className="mt-8 p-4 rounded-lg bg-blue-50/50" style={{ border: '1px solid var(--border-subtle)' }}>
                            <div className="flex gap-3">
                                <div className="p-2 rounded-full bg-blue-100 flex-shrink-0 h-fit">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-blue-900 mb-1">Safe Trading</h4>
                                    <p className="text-xs text-blue-700 leading-relaxed">
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
