'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, PlusCircle, Settings, LogOut, ShoppingBag, LayoutDashboard, Store, Users, MessageSquare, Sun, Moon } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { useTheme } from '@/components/ThemeProvider'

export default function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {
    const { user } = useUser()
    const { signOut } = useClerk()
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()

    // Sync profile to Supabase on load
    useEffect(() => {
        if (!user) return

        const syncProfile = async () => {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                full_name: user.fullName,
                avatar_url: user.imageUrl,
                updated_at: new Date().toISOString()
            })
        }

        syncProfile()
    }, [user])

    const navItems = [
        {
            href: '/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard
        },
        {
            href: '/dashboard/marketplace',
            label: 'Marketplace',
            icon: ShoppingBag
        },
        {
            href: '/dashboard/my-listings',
            label: 'My Shop',
            icon: Store
        },
        {
            href: '/dashboard/community',
            label: 'Community',
            icon: Users
        },
        {
            href: '/dashboard/messages',
            label: 'Messages',
            icon: MessageSquare
        },
        {
            href: '/dashboard/settings',
            label: 'Settings',
            icon: Settings
        }
    ]

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-light-blue)' }}>
            {/* Header */}
            <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                            OhmPlace
                        </Link>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg transition-colors hover:opacity-80"
                                style={{ color: 'var(--text-secondary)' }}
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {user?.primaryEmailAddress?.emailAddress}
                            </span>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-2 text-sm transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <nav className="rounded-lg shadow-md p-4" style={{ background: 'var(--bg-card)' }}>
                            <ul className="space-y-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                                                style={{
                                                    background: isActive ? 'var(--brand-primary)' : 'transparent',
                                                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                                                }}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="font-medium">{item.label}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-3">{children}</main>
                </div>
            </div>
        </div>
    )
}
