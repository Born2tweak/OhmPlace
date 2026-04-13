import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PublicListingClient from './PublicListingClient'

interface Props {
    params: Promise<{ id: string }>
}

const supabasePublic = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const { data } = await supabasePublic
        .from('listings')
        .select('title, description, price, listing_images(image_url)')
        .eq('id', id)
        .single()

    if (!data) return { title: 'Listing | OhmPlace' }

    const price = `$${(data.price / 100).toFixed(2)}`
    const image = (data.listing_images as { image_url: string }[])?.[0]?.image_url

    return {
        title: `${data.title} — ${price} | OhmPlace`,
        description: data.description ?? `${data.title} for ${price} on OhmPlace Campus Marketplace`,
        openGraph: {
            title: `${data.title} — ${price}`,
            description: data.description ?? `Available on OhmPlace Campus Marketplace`,
            images: image ? [{ url: image, width: 1200, height: 630 }] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${data.title} — ${price}`,
            description: data.description ?? `Available on OhmPlace`,
            images: image ? [image] : [],
        },
    }
}

export default async function PublicListingPage({ params }: Props) {
    const { id } = await params

    const { data: listing } = await supabasePublic
        .from('listings')
        .select('*, listing_images(*)')
        .eq('id', id)
        .single()

    if (!listing) notFound()

    return <PublicListingClient listing={listing} />
}
