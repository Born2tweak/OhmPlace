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
}

export async function POST(request: NextRequest) {
    const user = await getAuthenticatedUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listingId, tier } = body as { listingId: string; tier: keyof typeof BOOST_TIERS }

    if (!listingId || !tier || !BOOST_TIERS[tier]) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const boostTier = BOOST_TIERS[tier]

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
            success_url: `${request.headers.get('origin')}/dashboard/my-listings?boosted=true`,
            cancel_url: `${request.headers.get('origin')}/dashboard/my-listings`,
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
