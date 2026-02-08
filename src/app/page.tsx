'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Home() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [authLoading, setAuthLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const validateEmail = (email: string): { valid: boolean; error?: string } => {
        if (!email) return { valid: false, error: 'Email is required.' }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) return { valid: false, error: 'Please enter a valid email.' }
        if (!/@.+\.edu$/i.test(email)) return { valid: false, error: 'Only .edu emails are allowed.' }
        return { valid: true }
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthLoading(true)
        setMessage('')
        setError('')

        const validation = validateEmail(email.trim().toLowerCase())
        if (!validation.valid) {
            setError(validation.error!)
            setAuthLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim().toLowerCase(),
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            })
            if (error) throw error
            setMessage('Check your email for the login link!')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong.')
        } finally {
            setAuthLoading(false)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    const getCampus = (email: string | undefined): string => {
        if (!email) return ''
        const match = email.match(/@(.+\.edu)$/i)
        return match ? match[1] : ''
    }

    return (
        <div className="min-h-screen bg-[#0f0f1a] relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-xl">OhmPlace</span>
                        </div>

                        {!loading && user && (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm text-white">{user.email}</p>
                                    <p className="text-xs text-gray-400">{getCampus(user.email)}</p>
                                </div>
                                <button onClick={handleSignOut} className="btn-secondary text-sm">
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <main className="relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Copy */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-indigo-300 text-sm font-medium mb-6">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                For Students, By Students
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
                                Your Campus
                                <span className="block gradient-text">Marketplace</span>
                            </h1>

                            <p className="text-lg text-gray-300 mb-8 max-w-lg">
                                Buy, sell, and trade parts with students on your campus.
                                Skip the shipping wait—meet up and exchange today.
                            </p>

                            {/* Value props */}
                            <div className="grid sm:grid-cols-3 gap-4 mb-8">
                                <div className="glass rounded-xl p-4">
                                    <div className="text-2xl font-bold text-white">.edu</div>
                                    <div className="text-sm text-gray-400">Verified Only</div>
                                </div>
                                <div className="glass rounded-xl p-4">
                                    <div className="text-2xl font-bold text-white">Local</div>
                                    <div className="text-sm text-gray-400">Same Campus</div>
                                </div>
                                <div className="glass rounded-xl p-4">
                                    <div className="text-2xl font-bold text-white">Fast</div>
                                    <div className="text-sm text-gray-400">No Shipping</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Auth Card */}
                        <div className="glass rounded-2xl p-8 shadow-2xl">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            ) : user ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">You're in!</h2>
                                    <p className="text-gray-400 mb-6">Logged in as {user.email}</p>
                                    <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
                                        Browse Listings (Coming Soon)
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
                                    <p className="text-gray-400 mb-6">Sign in with your university email</p>

                                    <form onSubmit={handleAuth} className="space-y-4">
                                        <div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError('') }}
                                                placeholder="you@university.edu"
                                                disabled={authLoading}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="btn-primary w-full flex items-center justify-center gap-2"
                                        >
                                            {authLoading ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Sending...
                                                </>
                                            ) : (
                                                'Continue with Email'
                                            )}
                                        </button>
                                    </form>

                                    {error && (
                                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
                                            {error}
                                        </div>
                                    )}

                                    {message && (
                                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-300">
                                            {message}
                                        </div>
                                    )}

                                    <p className="mt-4 text-xs text-gray-500 text-center">
                                        Only .edu emails are accepted to keep the community trusted.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-6">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    © 2026 OhmPlace. Built for students, by students.
                </div>
            </footer>
        </div>
    )
}
