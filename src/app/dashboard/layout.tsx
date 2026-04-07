'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, LogOut, ShoppingBag, LayoutDashboard, Store, Users, MessageSquare, Sun, Moon } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { useTheme } from '@/components/ThemeProvider'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import CampusGate from '@/components/CampusGate'
import { CampusContext } from '@/components/CampusContext'
import { AvatarContext } from '@/components/AvatarContext'

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
    const [tappedNav, setTappedNav] = useState<string | null>(null)
    const [campus, setCampus] = useState<string | null>(null)
    const [showCampusGate, setShowCampusGate] = useState(false)


    // Sync profile to Supabase via server-side API on load (client Supabase fails RLS without JWT)
    useEffect(() => {
        if (!user) return

        const syncProfile = async () => {
            try {
                const res = await fetch('/api/sync-profile', { method: 'POST' })
                if (res.ok) {
                    const data = await res.json() as { avatar_url?: string; campus?: string | null }
                    setProfileAvatar(data.avatar_url || user.imageUrl)
                    if (data.campus) {
                        setCampus(data.campus)
                    } else {
                        setShowCampusGate(true)
                    }
                } else {
                    setProfileAvatar(user.imageUrl)
                    setShowCampusGate(true)
                }
            } catch {
                setProfileAvatar(user.imageUrl)
            }
        }

        syncProfile()
    }, [user])

    // Clear bounce animation after it plays
    useEffect(() => {
        if (tappedNav) {
            const timer = setTimeout(() => setTappedNav(null), 400)
            return () => clearTimeout(timer)
        }
    }, [tappedNav])

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag },
        { href: '/dashboard/my-listings', label: 'My Shop', icon: Store },
        { href: '/dashboard/community', label: 'Community', icon: Users },
        { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
        { href: '/dashboard/settings', label: 'Settings', icon: Settings }
    ]

    return (
        <AvatarContext.Provider value={{ profileAvatar, setProfileAvatar }}>
        <CampusContext.Provider value={campus}>
        <div className="min-h-screen" style={{ background: 'var(--bg-gradient)' }}>
            {showCampusGate && (
                <CampusGate onCampusSet={(c) => { setCampus(c); setShowCampusGate(false) }} />
            )}
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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar — hidden on mobile */}
                    <aside className="hidden lg:block lg:col-span-1">
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

                    {/* Main Content — page transition on route change */}
                    <main className="lg:col-span-3">
                        <div key={pathname} className="page-transition">
                            <ErrorBoundary>
                                <ToastProvider>{children}</ToastProvider>
                            </ErrorBoundary>
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Bottom Navigation — enhanced glass + tap bounce */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
                style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(24px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                }}
            >
                <div className="flex items-center justify-around px-2 h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        const isBouncing = tappedNav === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setTappedNav(item.href)}
                                className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl transition-all min-w-[56px]"
                                style={{
                                    color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                                }}
                            >
                                <div
                                    className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-300 ${isBouncing ? 'nav-tap-bounce' : ''}`}
                                    style={{
                                        background: isActive
                                            ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)'
                                            : 'transparent',
                                    }}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
        </CampusContext.Provider>
        </AvatarContext.Provider>
    )
}
