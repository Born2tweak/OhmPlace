'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, PlusCircle, Settings, LogOut } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'

export default function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {
    const { user } = useUser()
    const { signOut } = useClerk()
    const pathname = usePathname()

    const navItems = [
        {
            href: '/dashboard/my-listings',
            label: 'My Listings',
            icon: Package
        },
        {
            href: '/dashboard/new-listing',
            label: 'Create Listing',
            icon: PlusCircle
        },
        {
            href: '/dashboard/settings',
            label: 'Settings',
            icon: Settings
        }
    ]

    return (
        <div className="min-h-screen bg-[#e8f4f5]">
            {/* Header */}
            <header className="bg-white border-b border-[#d4e8ea]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold text-[#22c1c3]">
                            OhmPlace
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-[#5a6c7d]">
                                {user?.primaryEmailAddress?.emailAddress}
                            </span>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-2 text-sm text-[#5a6c7d] hover:text-[#2c3e50] transition-colors"
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
                        <nav className="bg-white rounded-lg shadow-md p-4">
                            <ul className="space-y-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                          ${isActive
                                                        ? 'bg-[#22c1c3] text-white'
                                                        : 'text-[#5a6c7d] hover:bg-[#f4fafb]'
                                                    }
                        `}
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
