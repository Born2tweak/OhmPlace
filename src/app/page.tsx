'use client'

import { useUser, useClerk, SignIn, SignUp } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function Home() {
    const { user, isLoaded, isSignedIn } = useUser()
    const { signOut } = useClerk()
    const [eduError, setEduError] = useState(false)
    const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
    const { theme, setTheme } = useTheme()

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
        <div className="min-h-screen" style={{ background: 'var(--bg-light-blue)' }}>
            {/* Nav */}
            <nav className="backdrop-blur-md sticky top-0 z-50"
                style={{ borderBottom: '1px solid var(--border-subtle)', background: theme === 'dark' ? 'rgba(30, 42, 58, 0.7)' : 'rgba(255, 255, 255, 0.7)' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                style={{ background: `linear-gradient(135deg, var(--brand-primary), var(--brand-accent))` }}>
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>OhmPlace</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-lg transition-colors hover:opacity-80"
                                style={{ color: 'var(--text-secondary)' }}
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {isLoaded && isSignedIn && (
                                <>
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                                        style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)' }}>
                                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-primary)' }}></span>
                                        <span className="text-sm font-medium" style={{ color: 'var(--brand-accent)' }}>{getCampus(user?.primaryEmailAddress?.emailAddress)}</span>
                                    </div>
                                    <button onClick={() => signOut()} className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                        Sign Out
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <main>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-sm"
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--brand-accent)' }}>
                                <span className="text-lg">🎓</span>
                                For Students, By Students
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight"
                                style={{ color: 'var(--text-primary)' }}>
                                Your Campus
                                <span className="block gradient-text">Marketplace</span>
                            </h1>

                            <p className="text-lg mb-8 max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Buy, sell, and trade with students on your campus.
                                Skip the shipping—meet up and exchange today.
                            </p>

                            <div className="flex flex-wrap gap-3 mb-8">
                                {['✓ .edu Verified', '✓ Local Pickup', '✓ No Fees'].map((text) => (
                                    <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm"
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                                        <span style={{ color: 'var(--brand-primary)' }}>{text.split(' ')[0]}</span>
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{text.split(' ').slice(1).join(' ')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Auth */}
                        <div className="card p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            {!isLoaded ? (
                                <div className="flex items-center justify-center py-12">
                                    <svg className="animate-spin h-8 w-8" style={{ color: 'var(--brand-primary)' }} fill="none" viewBox="0 0 24 24">
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
                                        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Invalid Email</h2>
                                        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Only .edu emails allowed.</p>
                                        <button onClick={() => signOut()} className="btn-primary w-full">Sign Out</button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                            style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' }}>
                                            <svg className="w-8 h-8" style={{ color: 'var(--brand-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Welcome! 👋</h2>
                                        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{user?.primaryEmailAddress?.emailAddress}</p>
                                        <div className="space-y-3">
                                            <Link href="/dashboard/my-listings" className="block w-full text-white py-3 px-6 rounded-lg font-medium transition-colors text-center"
                                                style={{ background: 'var(--brand-primary)' }}>
                                                View Dashboard
                                            </Link>
                                            <Link href="/dashboard/new-listing" className="block w-full py-3 px-6 rounded-lg font-medium transition-colors text-center"
                                                style={{ border: '2px solid var(--brand-primary)', color: 'var(--brand-primary)' }}>
                                                + Sell an Item
                                            </Link>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="w-full">
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                            {mode === 'sign-up' ? 'Create Account' : 'Get Started'}
                                        </h2>
                                        <p style={{ color: 'var(--text-secondary)' }}>
                                            {mode === 'sign-up' ? 'Join with your university email' : 'Sign in with your university email'}
                                        </p>
                                    </div>
                                    <div className="w-full flex justify-center">
                                        <div className="w-full">
                                            {mode === 'sign-up' ? (
                                                <SignUp
                                                    forceRedirectUrl="/dashboard"
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
                                                    forceRedirectUrl="/dashboard"
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
                                            className="text-sm transition-colors"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {mode === 'sign-up' ? (
                                                <>Already have an account? <span className="font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>Sign in</span></>
                                            ) : (
                                                <>Don&apos;t have an account? <span className="font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>Sign up</span></>
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                                        Only .edu emails accepted
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="py-16" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>How it works</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: '📝', title: 'List your item', desc: "Post what you're selling in seconds" },
                                { icon: '🤝', title: 'Connect locally', desc: 'Find buyers/sellers on your campus' },
                                { icon: '✨', title: 'Meet & exchange', desc: 'No shipping, no waiting' },
                            ].map((step) => (
                                <div key={step.title} className="text-center">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl"
                                        style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' }}>
                                        {step.icon}
                                    </div>
                                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                <div className="max-w-6xl mx-auto px-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    © 2026 OhmPlace
                </div>
            </footer>
        </div>
    )
}
