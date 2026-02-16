import { auth, currentUser } from '@clerk/nextjs/server'

export async function getAuthenticatedUser() {
    const { userId } = await auth()
    if (!userId) return null

    const user = await currentUser()
    if (!user) return null

    const email = user.primaryEmailAddress?.emailAddress
    if (!email) return null

    const campus = email.split('@')[1] // e.g., "purdue.edu"
    const username = user.firstName
        ? `${user.firstName}${user.lastName ? ' ' + user.lastName.charAt(0) + '.' : ''}`
        : email.split('@')[0]

    return { userId, email, campus, username }
}
