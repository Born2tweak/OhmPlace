import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabase } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia'
})

export async function POST(request: NextRequest) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session

        const listingId = session.metadata?.listing_id
        const durationHours = parseInt(session.metadata?.duration_hours || '24')

        if (listingId) {
            const supabase = getSupabase()
            const promotedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()

            const { error } = await supabase
                .from('listings')
                .update({
                    promoted: true,
                    promoted_until: promotedUntil,
                })
                .eq('id', listingId)

            if (error) {
                console.error('Failed to update listing promotion:', error)
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
            }

            console.log(`Listing ${listingId} promoted until ${promotedUntil}`)
        }
    }

    return NextResponse.json({ received: true })
}
