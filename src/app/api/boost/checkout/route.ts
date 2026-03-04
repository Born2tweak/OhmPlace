import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthenticatedUser } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover'
})

const BOOST_TIERS = {
    '24h': { hours: 24, price: 99, label: '24 Hours' },
    '3d': { hours: 72, price: 199, label: '3 Days' },
    '7d': { hours: 168, price: 399, label: '7 Days' },
} as const

type BoostTier = keyof typeof BOOST_TIERS

function isValidTier(tier: string): tier is BoostTier {
    return tier in BOOST_TIERS
}

export async function POST(request: NextRequest) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { listingId, tier } = (body as Record<string, unknown>) ?? {}

    if (
        typeof listingId !== 'string' || !listingId.trim() ||
        typeof tier !== 'string' || !isValidTier(tier)
    ) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const boostTier = BOOST_TIERS[tier]

    // Use a trusted base URL from env to prevent open-redirect
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Boost Listing - ${boostTier.label}`,
                            description: `Promote your listing to the top of the marketplace for ${boostTier.label.toLowerCase()}`,
                        },
                        unit_amount: boostTier.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${appUrl}/dashboard/my-listings?boosted=true`,
            cancel_url: `${appUrl}/dashboard/my-listings`,
            metadata: {
                listing_id: listingId,
                user_id: user.userId,
                tier: tier,
                duration_hours: boostTier.hours.toString(),
            },
        })

        return NextResponse.json({ url: session.url })
    } catch (error) {
        console.error('Stripe checkout error:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
