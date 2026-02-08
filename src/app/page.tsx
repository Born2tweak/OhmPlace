'use client'

import { useUser, useClerk, SignIn } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

export default function Home() {
    const { user, isLoaded, isSignedIn } = useUser()
    const { signOut } = useClerk()
    const [eduError, setEduError] = useState(false)

    useEffect(() => {
        if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
            const email = user.primaryEmailAddress.emailAddress
            if (!/@.+\.edu$/i.test(email)) {
                setEduError(true)
            }
        }
    }, [isSignedIn, user])

    const getCampus = (email: string | undefined): string => {
        if (!email) return ''
        const match = email.match(/@(.+\.edu)$/i)
        return match ? match[1].replace('.edu', '').toUpperCase() : ''
    }

    return (
        <div className="min-h-screen bg-[#fefbf6]">
            {/* Nav */}
            <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-gray-900 font-bold text-xl">OhmPlace</span>
                        </div>

                        {isLoaded && isSignedIn && (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="text-sm font-medium text-amber-800">{getCampus(user?.primaryEmailAddress?.emailAddress)}</span>
                                </div>
                                <button onClick={() => signOut()} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <main>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium mb-6">
                                <span className="text-lg">🎓</span>
                                For Students, By Students
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                                Your Campus
                                <span className="block gradient-text">Marketplace</span>
                            </h1>

                            <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
                                Buy, sell, and trade with students on your campus.
                                Skip the shipping—meet up and exchange today.
                            </p>

                            <div className="flex flex-wrap gap-3 mb-8">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
                                    <span className="text-amber-500">✓</span>
                                    <span className="text-sm font-medium text-gray-700">.edu Verified</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
                                    <span className="text-amber-500">✓</span>
                                    <span className="text-sm font-medium text-gray-700">Local Pickup</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
                                    <span className="text-amber-500">✓</span>
                                    <span className="text-sm font-medium text-gray-700">No Fees</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Auth */}
                        <div className="card p-8">
                            {!isLoaded ? (
                                <div className="flex items-center justify-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            ) : isSignedIn ? (
                                eduError ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Email</h2>
                                        <p className="text-gray-600 mb-6">Only .edu emails allowed.</p>
                                        <button onClick={() => signOut()} className="btn-primary w-full">Sign Out</button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome! 👋</h2>
                                        <p className="text-gray-600 mb-6">{user?.primaryEmailAddress?.emailAddress}</p>
                                        <button disabled className="btn-primary w-full opacity-60 cursor-not-allowed">
                                            Browse Listings (Coming Soon)
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div>
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Get Started</h2>
                                        <p className="text-gray-600">Sign in with your university email</p>
                                    </div>
                                    <SignIn
                                        appearance={{
                                            elements: {
                                                rootBox: 'w-full',
                                                card: 'bg-transparent shadow-none p-0',
                                                headerTitle: 'hidden',
                                                headerSubtitle: 'hidden',
                                                socialButtonsBlockButton: 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100',
                                                formFieldInput: 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-amber-500',
                                                formButtonPrimary: 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-md',
                                                footerActionLink: 'text-amber-600 hover:text-amber-700',
                                            }
                                        }}
                                        routing="hash"
                                    />
                                    <p className="mt-4 text-xs text-gray-500 text-center">
                                        Only .edu emails accepted
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="bg-white border-t border-gray-200 py-16">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How it works</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 text-xl">📝</div>
                                <h3 className="font-semibold text-gray-900 mb-2">List your item</h3>
                                <p className="text-gray-600 text-sm">Post what you're selling in seconds</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 text-xl">🤝</div>
                                <h3 className="font-semibold text-gray-900 mb-2">Connect locally</h3>
                                <p className="text-gray-600 text-sm">Find buyers/sellers on your campus</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-xl">✨</div>
                                <h3 className="font-semibold text-gray-900 mb-2">Meet & exchange</h3>
                                <p className="text-gray-600 text-sm">No shipping, no waiting</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 py-6 bg-white">
                <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
                    © 2026 OhmPlace
                </div>
            </footer>
        </div>
    )
}
