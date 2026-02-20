'use client'

import { Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="rounded-lg shadow-md p-8" style={{ background: 'var(--bg-card)' }}>
            <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Account Settings</h1>

            <div className="text-center py-12">
                <SettingsIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-subtle)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Settings page coming soon</p>
            </div>
        </div>
    )
}
