import { auth, currentUser } from '@clerk/nextjs/server'
import { detectCampusFromEmail } from '@/lib/campus'

export async function getAuthenticatedUser() {
    const { userId } = await auth()
    if (!userId) return null

    const user = await currentUser()
    if (!user) return null

    const email = user.primaryEmailAddress?.emailAddress
    if (!email) return null

    const campus = detectCampusFromEmail(email) ?? email.split('@')[1]
    const username = user.firstName
        ? `${user.firstName}${user.lastName ? ' ' + user.lastName.charAt(0) + '.' : ''}`
        : email.split('@')[0]

    return { userId, email, campus, username }
}
