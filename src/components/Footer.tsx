'use client'

import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'

export default function Footer() {
    const { theme } = useTheme()

    const productLinks = [
        { label: 'Marketplace', href: '/dashboard/marketplace' },
        { label: 'Community', href: '/dashboard/community' },
        { label: 'Messages', href: '/dashboard/messages' },
        { label: 'My Shop', href: '/dashboard/my-listings' },
    ]

    const companyLinks = [
        { label: 'About', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Contact', href: '#' },
    ]

    return (
        <footer style={{
            borderTop: '1px solid var(--border-subtle)',
            background: theme === 'dark' ? 'rgba(20, 30, 42, 0.95)' : 'rgba(248, 252, 253, 0.95)'
        }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}>
                                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>OhmPlace</span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-muted)' }}>
                            The campus marketplace built for students.
                            Buy, sell, and connect with your university community.
                        </p>
                        <div className="flex items-center gap-2 mt-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                    background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)',
                                    color: 'var(--brand-primary)',
                                    border: '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)'
                                }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-primary)' }} />
                                .edu verified
                            </span>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Product
                        </h3>
                        <ul className="space-y-2.5">
                            {productLinks.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-sm transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Company
                        </h3>
                        <ul className="space-y-2.5">
                            {companyLinks.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-sm transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Campus */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
                            For Students
                        </h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            Sign up with your .edu email to access your campus marketplace.
                            No fees, no shipping — just local exchanges.
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        © {new Date().getFullYear()} OhmPlace. All rights reserved.
                    </p>
                    <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        Made with <span className="text-red-400">♥</span> for students
                    </p>
                </div>
            </div>
        </footer>
    )
}
