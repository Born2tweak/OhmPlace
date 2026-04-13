'use client'

import { useUser, useClerk, SignIn, SignUp } from '@clerk/nextjs'
import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, ShoppingBag, MessageCircle, GraduationCap, Shield, Zap, Users, ArrowRight, Star } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
    const { user, isLoaded, isSignedIn } = useUser()
    const { signOut } = useClerk()
    const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up')
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const authRef = useRef<HTMLDivElement>(null)

    const email = user?.primaryEmailAddress?.emailAddress
    const eduError = Boolean(isSignedIn && email && !/@.+\.edu$/i.test(email))

    useEffect(() => {
        if (isSignedIn && email && !eduError) {
            router.replace('/dashboard')
        }
    }, [eduError, email, isSignedIn, router])

    const scrollToAuth = (m: 'sign-in' | 'sign-up' = 'sign-up') => {
        setMode(m)
        authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-light-blue)' }}>
            {/* Nav */}
            <nav className="backdrop-blur-md sticky top-0 z-50"
                style={{ borderBottom: '1px solid var(--border-subtle)', background: theme === 'dark' ? 'rgba(30, 42, 58, 0.85)' : 'rgba(255, 255, 255, 0.85)' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="OhmPlace" className="w-9 h-9 rounded-xl" />
                            <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>OhmPlace</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-lg transition-colors hover:opacity-80"
                                style={{ color: 'var(--text-secondary)' }}
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => scrollToAuth('sign-in')}
                                className="text-sm font-medium transition-colors hover:opacity-80"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => scrollToAuth('sign-up')}
                                className="btn-primary text-sm px-4 py-2 rounded-lg"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 shadow-sm"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--brand-accent)' }}>
                        <span>🎓</span> .edu verified — students only
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
                        style={{ color: 'var(--text-primary)' }}>
                        Buy & sell on
                        <span className="block gradient-text">your campus</span>
                    </h1>

                    <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        OhmPlace is the marketplace built exclusively for college students.
                        No strangers, no shipping — just students on your campus.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <button
                            onClick={() => scrollToAuth('sign-up')}
                            className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold"
                        >
                            Start selling for free <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scrollToAuth('sign-in')}
                            className="btn-secondary inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold"
                        >
                            Already have an account
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { icon: '✓', text: '.edu Verified Only' },
                            { icon: '✓', text: 'Zero Listing Fees' },
                            { icon: '✓', text: 'Local Pickup' },
                            { icon: '✓', text: 'Campus Community' },
                        ].map(({ icon, text }) => (
                            <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm shadow-sm"
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                                <span style={{ color: 'var(--brand-primary)' }}>{icon}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features */}
                <section className="py-20" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
                            Everything you need, nothing you don&apos;t
                        </h2>
                        <p className="text-center mb-14 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            Built for the way students actually buy and sell.
                        </p>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: <Shield className="w-6 h-6" />,
                                    title: '.edu Verified',
                                    desc: 'Every user is verified with a university email. No randoms, no scammers — only fellow students.',
                                },
                                {
                                    icon: <GraduationCap className="w-6 h-6" />,
                                    title: 'Campus-Scoped Feed',
                                    desc: 'See listings from your school by default. Browse other campuses whenever you want.',
                                },
                                {
                                    icon: <MessageCircle className="w-6 h-6" />,
                                    title: 'Built-in Messaging',
                                    desc: 'DM sellers directly in-app. No need to swap numbers with strangers.',
                                },
                                {
                                    icon: <ShoppingBag className="w-6 h-6" />,
                                    title: 'Zero Fees',
                                    desc: 'List anything for free. We don\'t take a cut. You keep every dollar.',
                                },
                                {
                                    icon: <Users className="w-6 h-6" />,
                                    title: 'Campus Community',
                                    desc: 'Post in the community feed — ask questions, share events, find study groups.',
                                },
                                {
                                    icon: <Zap className="w-6 h-6" />,
                                    title: 'List in Seconds',
                                    desc: 'Add photos, set a price, and go live. The whole process takes under a minute.',
                                },
                            ].map((f) => (
                                <div key={f.title} className="card p-6 rounded-2xl transition-all hover:scale-[1.02]">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                        style={{ background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)', color: 'var(--brand-primary)' }}>
                                        {f.icon}
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* What you can sell */}
                <section className="py-20">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                            What are students selling?
                        </h2>
                        <p className="mb-12 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            Anything a student would want to buy or offload.
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 mb-12">
                            {[
                                '📚 Textbooks', '💻 Laptops', '🛋️ Furniture', '👟 Clothes & Shoes',
                                '🎮 Gaming Gear', '🚲 Bikes', '🍳 Kitchen Stuff', '📱 Electronics',
                                '🎒 Backpacks', '🏋️ Gym Equipment', '🖨️ Printers', '🎵 Instruments',
                            ].map((item) => (
                                <div key={item} className="px-4 py-2 rounded-full text-sm font-medium"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                    {item}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => scrollToAuth('sign-up')}
                            className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold"
                        >
                            List your first item free <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </section>

                {/* How it works */}
                <section className="py-20" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
                            Up and running in 60 seconds
                        </h2>
                        <p className="text-center mb-14 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            No app download. Just sign up with your .edu and go.
                        </p>

                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {[
                                { step: '01', icon: '🎓', title: 'Sign up with .edu', desc: 'Create your account using your university email. Takes 30 seconds.' },
                                { step: '02', icon: '📸', title: 'Snap & list', desc: 'Add photos, write a description, set your price. Your listing goes live immediately.' },
                                { step: '03', icon: '🤝', title: 'Meet on campus', desc: 'Buyers message you in-app. Arrange a meetup anywhere on campus — done.' },
                            ].map((s, i) => (
                                <div key={s.step} className="text-center relative">
                                    {i < 2 && (
                                        <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px"
                                            style={{ background: 'linear-gradient(to right, var(--brand-primary), transparent)', opacity: 0.3 }} />
                                    )}
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl relative z-10"
                                        style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)' }}>
                                        {s.icon}
                                    </div>
                                    <div className="text-xs font-bold mb-2 tracking-widest uppercase" style={{ color: 'var(--brand-primary)' }}>{s.step}</div>
                                    <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonial / social proof */}
                <section className="py-20">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-center mb-14" style={{ color: 'var(--text-primary)' }}>
                            Students love it
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { quote: "Sold my old textbooks in like 2 hours. Way easier than Facebook Marketplace.", name: "CS Junior, Purdue", stars: 5 },
                                { quote: "Finally a place where I know I'm only dealing with people from my school. Feels way safer.", name: "Freshman, Indiana University", stars: 5 },
                                { quote: "Got a barely used mini fridge for $30. The campus filter is clutch.", name: "Sophomore, Purdue", stars: 5 },
                            ].map((t) => (
                                <div key={t.name} className="card p-6 rounded-2xl">
                                    <div className="flex gap-1 mb-4">
                                        {Array.from({ length: t.stars }).map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#f59e0b' }} />
                                        ))}
                                    </div>
                                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                                        &ldquo;{t.quote}&rdquo;
                                    </p>
                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Auth section */}
                <section ref={authRef} className="py-20" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="max-w-md mx-auto px-4">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                                {mode === 'sign-up' ? 'Join OhmPlace' : 'Welcome back'}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {mode === 'sign-up' ? 'Sign up with your .edu email — it\'s free.' : 'Sign in to your account.'}
                            </p>
                        </div>

                        <div className="card p-8 rounded-2xl">
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
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Taking you to your dashboard...</p>
                                    </div>
                                )
                            ) : (
                                <div className="w-full">
                                    {mode === 'sign-up' ? (
                                        <SignUp
                                            routing="hash"
                                            fallbackRedirectUrl="/dashboard"
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
                                            routing="hash"
                                            fallbackRedirectUrl="/dashboard"
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

                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                                            className="text-sm transition-colors"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {mode === 'sign-up' ? (
                                                <>Already have an account? <span className="font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>Sign in</span></>
                                            ) : (
                                                <>Don&apos;t have an account? <span className="font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>Sign up free</span></>
                                            )}
                                        </button>
                                        {mode === 'sign-in' && (
                                            <div className="mt-3">
                                                <Link href="/forgot-password" className="text-sm transition-colors hover:underline" style={{ color: 'var(--text-muted)' }}>
                                                    Forgot your password?
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                                        Only .edu emails accepted
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-8" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="OhmPlace" className="w-7 h-7 rounded-lg" />
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>OhmPlace</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2026 OhmPlace · Built for students</p>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <button onClick={() => scrollToAuth('sign-up')} className="hover:underline" style={{ color: 'var(--brand-primary)' }}>
                            Get Started
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    )
}
