import Link from 'next/link'

export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20" />
                <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="glass rounded-2xl p-8 text-center">
                    {/* Error Icon */}
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-red-500/20 mb-4">
                        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
                    <p className="text-gray-400 mb-6">We couldn't verify your login link.</p>

                    <ul className="text-left text-sm text-gray-400 space-y-2 mb-6">
                        <li className="flex items-start gap-2">
                            <span className="text-gray-500">•</span>
                            The link may have expired (1 hour limit)
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-500">•</span>
                            The link was already used
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-500">•</span>
                            The link was incomplete or modified
                        </li>
                    </ul>

                    <Link href="/login" className="btn-primary w-full inline-flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Try Again
                    </Link>
                </div>
            </div>
        </div>
    )
}
