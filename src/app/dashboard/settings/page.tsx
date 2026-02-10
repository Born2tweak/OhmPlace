'use client'

import { Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-[#2c3e50] mb-6">Account Settings</h1>

            <div className="text-center py-12">
                <SettingsIcon className="w-16 h-16 text-[#d4e8ea] mx-auto mb-4" />
                <p className="text-[#5a6c7d]">Settings page coming soon</p>
            </div>
        </div>
    )
}
