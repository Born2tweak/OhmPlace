import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth()
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    try {
        const client = await clerkClient()
        const user = await client.users.getUser(id)

        return NextResponse.json({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            full_name: user.fullName,
            avatar_url: user.imageUrl,
        })
    } catch (error) {
        console.error('Error fetching user from Clerk:', error)
        return new NextResponse('User not found', { status: 404 })
    }
}
