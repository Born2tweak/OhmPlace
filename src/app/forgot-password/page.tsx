'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import Link from 'next/link'

type Stage = 'request' | 'verify' | 'success'

export default function ForgotPasswordPage() {
    const { isLoaded, signIn } = useSignIn()
    const [stage, setStage] = useState<Stage>('request')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Step 1: Request a password reset code
    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return
        setError('')
        setLoading(true)
        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            })
            setStage('verify')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message :
                (err as { errors?: { message: string }[] })?.errors?.[0]?.message || 'Something went wrong'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Verify the code and set a new password
    const handleVerifyAndReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return
        setError('')
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        setLoading(true)
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            })
            if (result.status === 'complete') {
                setStage('success')
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message :
                (err as { errors?: { message: string }[] })?.errors?.[0]?.message || 'Invalid code or error resetting password'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-1">OhmPlace</h1>
                        <p className="text-gray-400 text-sm">
                            {stage === 'request' && 'Reset your password'}
                            {stage === 'verify' && 'Check your email'}
                            {stage === 'success' && 'Password updated!'}
                        </p>
                    </div>

                    {/* Step 1: Enter email */}
                    {stage === 'request' && (
                        <form onSubmit={handleRequestReset} className="space-y-5">
                            <p className="text-gray-400 text-sm text-center">
                                {"Enter your account email and we'll send you a reset code."}
                            </p>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5">Email address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-60"
                            >
                                {loading ? 'Sending...' : 'Send reset code'}
                            </button>
                            <p className="text-center text-sm text-gray-400">
                                Remember your password?{' '}
                                <Link href="/sign-in" className="text-indigo-400 hover:text-indigo-300 transition">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    )}

                    {/* Step 2: Enter code + new password */}
                    {stage === 'verify' && (
                        <form onSubmit={handleVerifyAndReset} className="space-y-5">
                            <p className="text-gray-400 text-sm text-center">
                                We sent a reset code to <span className="text-white">{email}</span>. Enter it below along with your new password.
                            </p>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5">Reset code</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    required
                                    placeholder="6-digit code"
                                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5">New password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    placeholder="At least 8 characters"
                                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1.5">Confirm new password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Repeat password"
                                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-60"
                            >
                                {loading ? 'Resetting...' : 'Reset password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setStage('request'); setError('') }}
                                className="w-full text-sm text-gray-400 hover:text-gray-300 transition"
                            >
                                ← Back
                            </button>
                        </form>
                    )}

                    {/* Step 3: Success */}
                    {stage === 'success' && (
                        <div className="text-center space-y-5">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mx-auto">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-gray-300 text-sm">
                                Your password has been reset successfully. You can now sign in with your new password.
                            </p>
                            <Link
                                href="/sign-in"
                                className="block w-full py-2.5 rounded-lg font-semibold text-white text-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition"
                            >
                                Go to sign in
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
