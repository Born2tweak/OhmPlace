/**
 * Input sanitization utilities for user-generated content.
 * Strips control characters, excessive whitespace, and validates shape.
 */

/**
 * Remove ASCII control characters (except newline and tab),
 * zero-width characters, and collapse excessive whitespace.
 */
export function sanitizeText(input: string): string {
    return input
        // Remove ASCII control chars (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F)
        // Keep \t (0x09) and \n (0x0A) and \r (0x0D)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Remove zero-width characters
        .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '')
        // Collapse runs of 3+ newlines into 2
        .replace(/\n{3,}/g, '\n\n')
        // Trim leading/trailing whitespace
        .trim()
}

/**
 * Sanitize a single-line string (title, username, etc.)
 * Removes all newlines and collapses whitespace.
 */
export function sanitizeSingleLine(input: string): string {
    return sanitizeText(input)
        .replace(/[\r\n]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
}

/**
 * Validate and sanitize a flair value against allowed flairs.
 */
const ALLOWED_FLAIRS = ['question', 'discussion', 'selling', 'buying', 'event', 'meme', 'advice', 'rant']

export function sanitizeFlair(flair: string | null | undefined): string | null {
    if (!flair) return null
    const clean = sanitizeSingleLine(flair)
    return ALLOWED_FLAIRS.includes(clean) ? clean : null
}
