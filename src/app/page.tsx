'use client'

import { useUser, useClerk, SignIn, SignUp } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { Sun, Moon, Zap, Shield, MessageSquare, Users, ShoppingBag, ArrowRight } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

export default function Home() {
    const { user, isLoaded, isSignedIn } = useUser()
    const { signOut } = useClerk()
    const [eduError, setEduError] = useState(false)
    const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
    const { theme, setTheme } = useTheme()
    const router = useRouter()

    useEffect(() => {
        if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
            const email = user.primaryEmailAddress.emailAddress
            if (!/@.+\.edu$/i.test(email)) {
                setEduError(true)
            } else {
                router.replace('/dashboard')
            }
        }
    }, [isSignedIn, user, router])

    const clerkAppearance = {
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
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-light-blue)' }}>
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
                                <button onClick={() => signOut()} className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Sign Out
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    {/* Animated gradient blobs */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
                            style={{ background: 'var(--brand-primary)', animation: 'float 8s ease-in-out infinite' }} />
                        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
                            style={{ background: 'var(--brand-accent)', animation: 'float 10s ease-in-out infinite reverse' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl"
                            style={{ background: 'var(--brand-secondary)', animation: 'float 12s ease-in-out infinite' }} />
                    </div>

                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            {/* Left — Hero content */}
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-sm"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--brand-accent)' }}>
                                    <span className="text-lg">🎓</span>
                                    For Students, By Students
                                </div>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]"
                                    style={{ color: 'var(--text-primary)' }}>
                                    Your Campus
                                    <span className="block gradient-text">Marketplace</span>
                                </h1>

                                <p className="text-lg mb-8 max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    Buy, sell, and trade with verified students on your campus.
                                    Skip the shipping — meet up and exchange today.
                                </p>

                                {/* Feature pills */}
                                <div className="flex flex-wrap gap-3 mb-10">
                                    {['✓ .edu Verified', '✓ Local Pickup', '✓ No Fees', '✓ Real-time Chat'].map((text) => (
                                        <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-transform hover:scale-105"
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                                            <span style={{ color: 'var(--brand-primary)' }}>{text.split(' ')[0]}</span>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{text.split(' ').slice(1).join(' ')}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Floating stats */}
                                <div className="flex gap-8">
                                    {[
                                        { value: '500+', label: 'Students' },
                                        { value: '1.2K', label: 'Listings' },
                                        { value: '50+', label: 'Campuses' },
                                    ].map((stat) => (
                                        <div key={stat.label}>
                                            <p className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>{stat.value}</p>
                                            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right — Auth card */}
                            <div className="card p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
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
                                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                                            <svg className="animate-spin h-8 w-8" style={{ color: 'var(--brand-primary)' }} fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                Taking you to your dashboard...
                                            </p>
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
                                                    <SignUp forceRedirectUrl="/dashboard" appearance={clerkAppearance} />
                                                ) : (
                                                    <SignIn forceRedirectUrl="/dashboard" appearance={clerkAppearance} />
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
                </section>

                {/* Features Grid */}
                <section className="py-20" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                                Everything you need to trade on campus
                            </h2>
                            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                                A marketplace designed specifically for university students
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: <Shield className="w-6 h-6" />,
                                    title: 'Campus Verified',
                                    desc: 'Only .edu email holders can join. Trade with real, verified students from your university.',
                                    gradient: 'linear-gradient(135deg, #22c1c3, #1a9a9b)',
                                },
                                {
                                    icon: <ShoppingBag className="w-6 h-6" />,
                                    title: 'Zero Fees',
                                    desc: 'No commissions, no hidden fees. Keep 100% of your sale price every time.',
                                    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                },
                                {
                                    icon: <Zap className="w-6 h-6" />,
                                    title: 'Instant Listings',
                                    desc: 'Post what you\'re selling in seconds. Add photos, set your price, and go.',
                                    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                },
                                {
                                    icon: <MessageSquare className="w-6 h-6" />,
                                    title: 'Real-time Messaging',
                                    desc: 'Chat instantly with buyers and sellers. No need for email or phone numbers.',
                                    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                                },
                                {
                                    icon: <Users className="w-6 h-6" />,
                                    title: 'Community Boards',
                                    desc: 'Ask questions, share advice, and connect with your campus community.',
                                    gradient: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
                                },
                                {
                                    icon: <ArrowRight className="w-6 h-6" />,
                                    title: 'Local Pickup',
                                    desc: 'Meet on campus to exchange items. No shipping, no waiting, no hassle.',
                                    gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                                },
                            ].map((feature) => (
                                <div key={feature.title}
                                    className="group p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-default"
                                    style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)' }}>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 transition-transform group-hover:scale-110"
                                        style={{ background: feature.gradient }}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it Works */}
                <section className="py-20">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                                Get started in 3 steps
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { step: '01', icon: '📝', title: 'List your item', desc: 'Snap a photo, set your price, and post it in seconds.' },
                                { step: '02', icon: '🤝', title: 'Connect locally', desc: 'Verified students on your campus will find your listing.' },
                                { step: '03', icon: '✨', title: 'Meet & exchange', desc: 'Agree on a meetup spot, exchange, and you\'re done!' },
                            ].map((step) => (
                                <div key={step.step} className="text-center relative">
                                    <div className="text-6xl font-black mb-4 opacity-5" style={{ color: 'var(--text-primary)' }}>{step.step}</div>
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl -mt-14"
                                        style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' }}>
                                        {step.icon}
                                    </div>
                                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                                    <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}>
                            {/* Decorative circles */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: 'white' }} />
                            <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-10" style={{ background: 'white' }} />

                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative">
                                Ready to join your campus marketplace?
                            </h2>
                            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto relative">
                                Sign up with your .edu email and start buying, selling, and connecting with students today.
                            </p>
                            <button
                                onClick={() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                    setMode('sign-up')
                                }}
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold transition-all hover:scale-105 shadow-lg relative"
                                style={{ background: 'white', color: 'var(--brand-primary)' }}
                            >
                                Get Started Free
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <Footer />

            {/* Float animation keyframes */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-20px) rotate(2deg); }
                    66% { transform: translateY(10px) rotate(-1deg); }
                }
            `}</style>
        </div>
    )
}
