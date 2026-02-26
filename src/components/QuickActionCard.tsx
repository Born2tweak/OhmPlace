'use client'

import React from 'react'
import Link from 'next/link'
import { PlusCircle, Search } from 'lucide-react'

export default function QuickActionCard() {
    return (
        <div className="rounded-xl p-6 shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Find</h3>

            <div className="space-y-3">
                <Link
                    href="/dashboard/new-listing"
                    className="flex items-center gap-3 w-full p-3 rounded-lg transition-all group"
                    style={{ border: '1px solid var(--border-subtle)' }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }}>
                        <PlusCircle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>List an Item</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Turn unused projects into cash</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/community"
                    className="flex items-center gap-3 w-full p-3 rounded-lg transition-all group"
                    style={{ border: '1px solid var(--border-subtle)' }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'color-mix(in srgb, var(--brand-accent) 10%, transparent)', color: 'var(--brand-accent)' }}>
                        <Search className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Request a Part</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ask the community for help</div>
                    </div>
                </Link>
            </div>
        </div>
    )
}
