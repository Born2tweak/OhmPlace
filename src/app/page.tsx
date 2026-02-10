'use client'

import { useUser, useClerk, SignIn, SignUp } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
    const { user, isLoaded, isSignedIn } = useUser()
    const { signOut } = useClerk()
    const [eduError, setEduError] = useState(false)
    const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')

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
        <div className="min-h-screen bg-[#e8f4f5]">
            {/* Nav */}
            <nav className="border-b border-[#d4e8ea] bg-white/70 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22c1c3] to-[#15868e] flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-[#2c3e50] font-bold text-xl">OhmPlace</span>
                        </div>

                        {isLoaded && isSignedIn && (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#22c1c3]/10 rounded-full border border-[#22c1c3]/30">
                                    <span className="w-2 h-2 rounded-full bg-[#22c1c3]"></span>
                                    <span className="text-sm font-medium text-[#15868e]">{getCampus(user?.primaryEmailAddress?.emailAddress)}</span>
                                </div>
                                <button onClick={() => signOut()} className="text-sm text-[#5a6c7d] hover:text-[#2c3e50] font-medium transition-colors">
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#d4e8ea] text-[#15868e] text-sm font-medium mb-6 shadow-sm">
                                <span className="text-lg">🎓</span>
                                For Students, By Students
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2c3e50] tracking-tight mb-6 leading-tight">
                                Your Campus
                                <span className="block gradient-text">Marketplace</span>
                            </h1>

                            <p className="text-lg text-[#5a6c7d] mb-8 max-w-lg leading-relaxed">
                                Buy, sell, and trade with students on your campus.
                                Skip the shipping—meet up and exchange today.
                            </p>

                            <div className="flex flex-wrap gap-3 mb-8">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#d4e8ea] shadow-sm">
                                    <span className="text-[#22c1c3]">✓</span>
                                    <span className="text-sm font-medium text-[#5a6c7d]">.edu Verified</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#d4e8ea] shadow-sm">
                                    <span className="text-[#22c1c3]">✓</span>
                                    <span className="text-sm font-medium text-[#5a6c7d]">Local Pickup</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#d4e8ea] shadow-sm">
                                    <span className="text-[#22c1c3]">✓</span>
                                    <span className="text-sm font-medium text-[#5a6c7d]">No Fees</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Auth */}
                        <div className="card p-8">
                            {!isLoaded ? (
                                <div className="flex items-center justify-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-[#22c1c3]" fill="none" viewBox="0 0 24 24">
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
                                        <h2 className="text-xl font-bold text-[#2c3e50] mb-2">Invalid Email</h2>
                                        <p className="text-[#5a6c7d] mb-6">Only .edu emails allowed.</p>
                                        <button onClick={() => signOut()} className="btn-primary w-full">Sign Out</button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-[#22c1c3]/10 flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-[#22c1c3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-bold text-[#2c3e50] mb-2">Welcome! 👋</h2>
                                        <p className="text-[#5a6c7d] mb-6">{user?.primaryEmailAddress?.emailAddress}</p>
                                        <div className="space-y-3">
                                            <Link href="/dashboard/my-listings" className="block w-full bg-[#22c1c3] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#1a9a9b] transition-colors text-center">
                                                View Dashboard
                                            </Link>
                                            <Link href="/dashboard/new-listing" className="block w-full border-2 border-[#22c1c3] text-[#22c1c3] py-3 px-6 rounded-lg font-medium hover:bg-[#f4fafb] transition-colors text-center">
                                                + Sell an Item
                                            </Link>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="w-full">
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-[#2c3e50] mb-1">
                                            {mode === 'sign-up' ? 'Create Account' : 'Get Started'}
                                        </h2>
                                        <p className="text-[#5a6c7d]">
                                            {mode === 'sign-up' ? 'Join with your university email' : 'Sign in with your university email'}
                                        </p>
                                    </div>
                                    <div className="w-full flex justify-center">
                                        <div className="w-full">
                                            {mode === 'sign-up' ? (
                                                <SignUp
                                                    appearance={{
                                                        elements: {
                                                            rootBox: 'w-full mx-auto',
                                                            card: 'bg-transparent shadow-none p-0 w-full',
                                                            headerTitle: 'hidden',
                                                            headerSubtitle: 'hidden',
                                                            socialButtonsBlockButton: 'hidden',
                                                            socialButtonsBlockButtonText: 'hidden',
                                                            socialButtonsProviderIcon: 'hidden',
                                                            dividerRow: 'hidden',
                                                            alternativeMethodsBlockButton: 'hidden',
                                                            identityPreview: 'hidden',
                                                            identityPreviewText: 'hidden',
                                                            identityPreviewEditButton: 'hidden',
                                                            formFieldLabel__identifier: 'hidden',
                                                            formFieldInputShowPasswordButton: 'hidden',
                                                            badge: 'hidden',
                                                            formFieldHintText: 'hidden',
                                                            formFieldInput: 'bg-[#f4fafb] border border-[#d4e8ea] text-[#2c3e50] focus:border-[#22c1c3] rounded-lg w-full',
                                                            formButtonPrimary: 'bg-[#22c1c3] hover:bg-[#1a9a9b] shadow-md rounded-lg w-full',
                                                            formFieldAction: 'hidden',
                                                            footer: 'hidden',
                                                            footerAction: 'hidden',
                                                            footerActionLink: 'hidden',
                                                            footerActionText: 'hidden',
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <SignIn
                                                    appearance={{
                                                        elements: {
                                                            rootBox: 'w-full mx-auto',
                                                            card: 'bg-transparent shadow-none p-0 w-full',
                                                            headerTitle: 'hidden',
                                                            headerSubtitle: 'hidden',
                                                            socialButtonsBlockButton: 'hidden',
                                                            socialButtonsBlockButtonText: 'hidden',
                                                            socialButtonsProviderIcon: 'hidden',
                                                            dividerRow: 'hidden',
                                                            alternativeMethodsBlockButton: 'hidden',
                                                            identityPreview: 'hidden',
                                                            identityPreviewText: 'hidden',
                                                            identityPreviewEditButton: 'hidden',
                                                            formFieldLabel__identifier: 'hidden',
                                                            formFieldInputShowPasswordButton: 'hidden',
                                                            badge: 'hidden',
                                                            formFieldHintText: 'hidden',
                                                            formFieldInput: 'bg-[#f4fafb] border border-[#d4e8ea] text-[#2c3e50] focus:border-[#22c1c3] rounded-lg w-full',
                                                            formButtonPrimary: 'bg-[#22c1c3] hover:bg-[#1a9a9b] shadow-md rounded-lg w-full',
                                                            formFieldAction: 'hidden',
                                                            footer: 'hidden',
                                                            footerAction: 'hidden',
                                                            footerActionLink: 'hidden',
                                                            footerActionText: 'hidden',
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-6 text-center w-full">
                                        <button
                                            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                                            className="text-sm text-[#5a6c7d] hover:text-[#2c3e50] transition-colors"
                                        >
                                            {mode === 'sign-up' ? (
                                                <>Already have an account? <span className="text-[#22c1c3] font-medium hover:underline">Sign in</span></>
                                            ) : (
                                                <>Don&apos;t have an account? <span className="text-[#22c1c3] font-medium hover:underline">Sign up</span></>
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-4 text-xs text-[#95a5a6] text-center">
                                        Only .edu emails accepted
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="bg-white border-t border-[#d4e8ea] py-16">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold text-[#2c3e50] text-center mb-12">How it works</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-[#22c1c3]/10 flex items-center justify-center mx-auto mb-4 text-xl">📝</div>
                                <h3 className="font-semibold text-[#2c3e50] mb-2">List your item</h3>
                                <p className="text-[#5a6c7d] text-sm">Post what you're selling in seconds</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-[#22c1c3]/10 flex items-center justify-center mx-auto mb-4 text-xl">🤝</div>
                                <h3 className="font-semibold text-[#2c3e50] mb-2">Connect locally</h3>
                                <p className="text-[#5a6c7d] text-sm">Find buyers/sellers on your campus</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-[#22c1c3]/10 flex items-center justify-center mx-auto mb-4 text-xl">✨</div>
                                <h3 className="font-semibold text-[#2c3e50] mb-2">Meet & exchange</h3>
                                <p className="text-[#5a6c7d] text-sm">No shipping, no waiting</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#d4e8ea] py-6 bg-white">
                <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[#95a5a6]">
                    © 2026 OhmPlace
                </div>
            </footer>
        </div>
    )
}
