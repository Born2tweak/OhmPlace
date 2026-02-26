'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, LogOut, ShoppingBag, LayoutDashboard, Store, Users, MessageSquare, Sun, Moon } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { useTheme } from '@/components/ThemeProvider'
import { ToastProvider } from '@/components/Toast'

export default function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {
    const { user } = useUser()
    const { signOut } = useClerk()
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const [profileAvatar, setProfileAvatar] = useState<string | null>(null)

    // Sync profile to Supabase on load
    useEffect(() => {
        if (!user) return

        const syncProfile = async () => {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            const { data: existing } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
            const finalAvatarUrl = existing?.avatar_url || user.imageUrl

            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                full_name: user.fullName,
                avatar_url: finalAvatarUrl,
                updated_at: new Date().toISOString()
            })

            setProfileAvatar(finalAvatarUrl)
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
        <div className="min-h-screen" style={{ background: 'var(--bg-gradient)' }}>
            {/* Header */}
            <header className="glass sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold gradient-text tracking-tight">
                            OhmPlace
                        </Link>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-xl transition-all hover:scale-105"
                                style={{
                                    color: 'var(--text-secondary)',
                                    background: 'var(--bg-lighter)',
                                }}
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <div className="flex items-center gap-2">
                                {profileAvatar ? (
                                    <img src={profileAvatar} alt="Profile" className="w-7 h-7 rounded-full object-cover hidden sm:block" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full hidden sm:flex items-center justify-center text-white text-[10px] font-bold" style={{ background: 'var(--brand-primary)' }}>
                                        {user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="text-sm font-medium hidden md:inline truncate max-w-[150px]" style={{ color: 'var(--text-secondary)' }}>
                                    {user?.primaryEmailAddress?.emailAddress}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02]"
                                style={{
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-lighter)',
                                }}
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <nav className="glass rounded-2xl p-3 sticky top-24">
                            <ul className="space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all"
                                                style={{
                                                    background: isActive
                                                        ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
                                                        : 'transparent',
                                                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                                                    fontWeight: isActive ? 600 : 500,
                                                    boxShadow: isActive ? 'var(--shadow-button)' : 'none',
                                                }}
                                            >
                                                <Icon className="w-[18px] h-[18px]" />
                                                <span className="text-sm">{item.label}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-3">
                        <ToastProvider>{children}</ToastProvider>
                    </main>
                </div>
            </div>
        </div>
    )
}
