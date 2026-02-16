'use client'

import React from 'react'
import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
    return (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-[#22c1c3]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-[#22c1c3]" />
            </div>
            <h1 className="text-3xl font-bold text-[#2c3e50] mb-4">Messages Coming Soon</h1>
            <p className="text-[#5a6c7d] max-w-md mx-auto">
                Chat with sellers and buyers directly on OhmPlace. This feature is currently under development.
            </p>
        </div>
    )
}
