'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, Clock, ShieldCheck, ChevronLeft, ChevronRight, Share2, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ListingImage {
    id: string
    image_url: string
    order: number
}

interface Listing {
    id: string
    title: string
    description: string | null
    price: number
    category: string
    condition: string
    status: string
    campus: string | null
    created_at: string
    listing_images: ListingImage[]
}

type CarouselTouchState = { startX: number | null; startY: number | null }

export default function PublicListingClient({ listing }: { listing: Listing }) {
    const router = useRouter()
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [copied, setCopied] = useState(false)
    const carouselTouchRef = useRef<CarouselTouchState>({ startX: null, startY: null })

    const images = [...(listing.listing_images ?? [])].sort((a, b) => a.order - b.order)
    const isSold = listing.status !== 'available'

    const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    const conditionLabel = listing.condition === 'new' ? 'New' : listing.condition === 'used-good' ? 'Used — Good' : 'Used — Fair'

    const handleShare = async () => {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-light-blue)' }}>
            {/* Nav */}
            <nav className="backdrop-blur-md sticky top-0 z-50"
                style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.85)' }}>
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="OhmPlace" className="w-8 h-8 rounded-lg" />
                        <span className="font-bold text-xl gradient-text">OhmPlace</span>
                    </Link>
                    <Link href="/?mode=sign-up"
                        className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold">
                        Sign up free <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
                <button onClick={() => router.back()}
                    className="flex items-center gap-2 mb-6 text-sm font-medium hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--text-secondary)' }}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Image carousel */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl overflow-hidden relative"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            {images.length > 0 ? (
                                <div className="relative aspect-video overflow-hidden touch-pan-y"
                                    onTouchStart={(e) => {
                                        carouselTouchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY }
                                    }}
                                    onTouchEnd={(e) => {
                                        const { startX, startY } = carouselTouchRef.current
                                        if (startX == null || startY == null) return
                                        const diffX = startX - e.changedTouches[0].clientX
                                        const diffY = startY - e.changedTouches[0].clientY
                                        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                                            if (diffX > 0 && selectedImageIndex < images.length - 1) setSelectedImageIndex(p => p + 1)
                                            else if (diffX < 0 && selectedImageIndex > 0) setSelectedImageIndex(p => p - 1)
                                        }
                                        carouselTouchRef.current = { startX: null, startY: null }
                                    }}>
                                    <div className="flex transition-transform duration-300 ease-out h-full"
                                        style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}>
                                        {images.map((img, idx) => (
                                            <img key={img.id} src={img.image_url} alt={`${listing.title} ${idx + 1}`}
                                                className="w-full h-full object-contain flex-shrink-0" draggable={false} />
                                        ))}
                                    </div>
                                    {images.length > 1 && (
                                        <>
                                            {selectedImageIndex > 0 && (
                                                <button onClick={() => setSelectedImageIndex(p => p - 1)}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hidden sm:flex">
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                            )}
                                            {selectedImageIndex < images.length - 1 && (
                                                <button onClick={() => setSelectedImageIndex(p => p + 1)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hidden sm:flex">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            )}
                                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                                                {selectedImageIndex + 1} / {images.length}
                                            </div>
                                        </>
                                    )}
                                    {isSold && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                            <span className="text-white text-3xl font-black uppercase tracking-widest bg-black/60 px-6 py-3 rounded-2xl">SOLD</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-video flex items-center justify-center">
                                    <span className="text-4xl">🔌</span>
                                </div>
                            )}
                            {images.length > 1 && (
                                <div className="flex items-center justify-center gap-1.5 py-3">
                                    {images.map((_, idx) => (
                                        <button key={idx} onClick={() => setSelectedImageIndex(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${selectedImageIndex === idx ? 'w-5 bg-[var(--brand-primary)]' : 'w-1.5 bg-[var(--border-subtle)]'}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details panel */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl p-6 sticky top-24"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <h1 className="text-2xl font-bold mb-2 leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {listing.title}
                            </h1>
                            <div className="text-3xl font-bold mb-6" style={{ color: 'var(--brand-primary)' }}>
                                {formatPrice(listing.price)}
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-sm">
                                    <Tag className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{listing.category}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <ShieldCheck className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>Condition: <span className="font-semibold">{conditionLabel}</span></span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>Posted {formatDate(listing.created_at)}</span>
                                </div>
                                {listing.campus && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>{listing.campus}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {isSold ? (
                                    <div className="w-full py-3 rounded-xl text-center font-bold text-sm"
                                        style={{ background: 'var(--bg-lighter)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                                        This item has been sold
                                    </div>
                                ) : (
                                    <Link href={`/?redirect_url=/listing/${listing.id}`}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                                        style={{ background: 'var(--brand-primary)' }}>
                                        Sign up to message seller
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                                <button onClick={handleShare}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all"
                                    style={{ background: 'var(--bg-lighter)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                                    <Share2 className="w-5 h-5" />
                                    {copied ? 'Copied!' : 'Share Listing'}
                                </button>
                            </div>

                            <div className="mt-6 p-4 rounded-xl"
                                style={{ background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)', border: '1px solid var(--border-subtle)' }}>
                                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    🎓 <strong>OhmPlace</strong> is a campus marketplace for .edu students only. Sign up free to message the seller and arrange pickup on campus.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl p-8"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Description</h2>
                            <p className="whitespace-pre-wrap leading-relaxed text-sm"
                                style={{ color: 'var(--text-secondary)' }}>
                                {listing.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA banner */}
                {!isSold && (
                    <div className="mt-10 rounded-2xl p-8 text-center"
                        style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}>
                        <h3 className="text-2xl font-bold text-white mb-2">Want to buy this?</h3>
                        <p className="text-white/80 mb-6">Sign up with your .edu email — it&apos;s free. Message the seller and arrange pickup on campus.</p>
                        <Link href={`/?redirect_url=/listing/${listing.id}`}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-white rounded-xl font-bold transition-all hover:scale-[1.02]"
                            style={{ color: 'var(--brand-primary)' }}>
                            Create free account <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}
