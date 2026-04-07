/**
 * Maps email domains to their canonical school names.
 * Add more schools here as OhmPlace expands.
 */
const DOMAIN_TO_CAMPUS: Record<string, string> = {
    // Purdue University
    'purdue.edu': 'Purdue University',
    'student.purdue.edu': 'Purdue University',

    // Indiana University
    'iu.edu': 'Indiana University',
    'indiana.edu': 'Indiana University',

    // University of Michigan
    'umich.edu': 'University of Michigan',

    // Michigan State University
    'msu.edu': 'Michigan State University',

    // Ohio State University
    'osu.edu': 'Ohio State University',
    'buckeyemail.osu.edu': 'Ohio State University',

    // University of Illinois
    'illinois.edu': 'University of Illinois',

    // Northwestern University
    'northwestern.edu': 'Northwestern University',

    // University of Notre Dame
    'nd.edu': 'University of Notre Dame',
}

/**
 * Detects the campus/school name from an email address.
 * Returns null if the domain is not recognized.
 */
export function detectCampusFromEmail(email: string): string | null {
    if (!email) return null
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return null
    return DOMAIN_TO_CAMPUS[domain] ?? null
}

/**
 * All officially supported campuses that users can manually select from.
 */
export const SUPPORTED_CAMPUSES = [
    ...new Set(Object.values(DOMAIN_TO_CAMPUS))
].sort()
