'use client'

import React, { useState } from 'react'
import { X, Zap, Flame, Rocket, Loader2 } from 'lucide-react'

interface BoostModalProps {
    isOpen: boolean
    onClose: () => void
    listingId: string
    listingTitle: string
}

const TIERS = [
    {
        key: '24h' as const,
        label: '24 Hours',
        price: '$0.99',
        icon: Zap,
        color: '#3B82F6',
        description: 'Quick visibility boost',
    },
    {
        key: '3d' as const,
        label: '3 Days',
        price: '$1.99',
        icon: Flame,
        color: '#F59E0B',
        description: 'Best value — covers the weekend',
        popular: true,
    },
    {
        key: '7d' as const,
        label: '7 Days',
        price: '$3.99',
        icon: Rocket,
        color: '#8B5CF6',
        description: 'Maximum exposure for big items',
    },
]

export default function BoostModal({ isOpen, onClose, listingId, listingTitle }: BoostModalProps) {
    const [selectedTier, setSelectedTier] = useState<string>('3d')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleBoost = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/boost/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId, tier: selectedTier }),
            })

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                alert('Failed to create checkout session')
                setLoading(false)
            }
        } catch {
            alert('Something went wrong')
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                style={{ background: 'var(--bg-card)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            ⚡ Boost Your Listing
                        </h2>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {listingTitle}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tiers */}
                <div className="p-6 space-y-3">
                    {TIERS.map((tier) => {
                        const Icon = tier.icon
                        const isSelected = selectedTier === tier.key
                        return (
                            <button
                                key={tier.key}
                                onClick={() => setSelectedTier(tier.key)}
                                className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left relative"
                                style={{
                                    border: isSelected
                                        ? `2px solid ${tier.color}`
                                        : '2px solid var(--border-subtle)',
                                    background: isSelected
                                        ? `color-mix(in srgb, ${tier.color} 5%, var(--bg-card))`
                                        : 'var(--bg-card)',
                                }}
                            >
                                {tier.popular && (
                                    <span className="absolute -top-2.5 right-3 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                                        style={{ background: tier.color }}>
                                        POPULAR
                                    </span>
                                )}
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: `color-mix(in srgb, ${tier.color} 15%, transparent)` }}>
                                    <Icon className="w-5 h-5" style={{ color: tier.color }} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {tier.label}
                                        </span>
                                        <span className="font-bold text-lg" style={{ color: tier.color }}>
                                            {tier.price}
                                        </span>
                                    </div>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {tier.description}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={handleBoost}
                        disabled={loading}
                        className="w-full py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ background: 'var(--brand-primary)' }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Redirecting to checkout...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Boost Now
                            </>
                        )}
                    </button>
                    <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
                        Secure payment via Stripe. Your listing will appear at the top of the marketplace.
                    </p>
                </div>
            </div>
        </div>
    )
}
