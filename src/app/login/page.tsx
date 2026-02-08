'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const supabase = createClient()

    const validateEmail = (email: string): { valid: boolean; error?: string } => {
        if (!email) return { valid: false, error: 'Email is required.' }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) return { valid: false, error: 'Please enter a valid email.' }
        if (!/@.+\.edu$/i.test(email)) return { valid: false, error: 'Only .edu emails are allowed.' }
        return { valid: true }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setError('')

        const validation = validateEmail(email.trim().toLowerCase())
        if (!validation.valid) {
            setError(validation.error!)
            setLoading(false)
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
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Back link */}
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to home
                </Link>

                {/* Card */}
                <div className="glass rounded-2xl p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Sign in to OhmPlace</h1>
                        <p className="text-gray-400 mt-1">Enter your university email</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError('') }}
                            placeholder="you@university.edu"
                            disabled={loading}
                            autoFocus
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                        />

                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Sending...
                                </>
                            ) : 'Continue with Email'}
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

                    <p className="mt-6 text-xs text-gray-500 text-center">
                        Only .edu emails are accepted to keep the community trusted.
                    </p>
                </div>
            </div>
        </div>
    )
}
