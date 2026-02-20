'use client'

import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Not Found</h2>
            <p className="mb-8 max-w-md" style={{ color: 'var(--text-secondary)' }}>Could not find requested resource. The page you are looking for might have been removed or is temporarily unavailable.</p>
            <Link
                href="/dashboard"
                className="px-6 py-3 rounded-full font-medium transition-colors"
                style={{ background: 'var(--brand-primary)', color: '#ffffff' }}
            >
                Return to Dashboard
            </Link>
        </div>
    )
}
