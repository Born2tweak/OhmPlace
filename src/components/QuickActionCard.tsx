'use client'

import React from 'react'
import Link from 'next/link'
import { PlusCircle, Search } from 'lucide-react'

export default function QuickActionCard() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#d4e8ea]">
            <h3 className="text-lg font-bold text-[#2c3e50] mb-4">Quick Find</h3>

            <div className="space-y-3">
                <Link
                    href="/dashboard/new-listing"
                    className="flex items-center gap-3 w-full p-3 rounded-lg border border-[#d4e8ea] hover:border-[#22c1c3] hover:bg-[#f4fafb] transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-[#22c1c3]/10 flex items-center justify-center text-[#22c1c3] group-hover:bg-[#22c1c3] group-hover:text-white transition-colors">
                        <PlusCircle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-[#2c3e50]">List an Item</div>
                        <div className="text-xs text-[#5a6c7d]">Turn unused projects into cash</div>
                    </div>
                </Link>

                <button
                    disabled
                    className="flex items-center gap-3 w-full p-3 rounded-lg border border-[#d4e8ea] hover:border-[#22c1c3] hover:bg-[#f4fafb] transition-all group opacity-75 cursor-not-allowed"
                >
                    <div className="w-10 h-10 rounded-full bg-[#15868e]/10 flex items-center justify-center text-[#15868e] group-hover:bg-[#15868e] group-hover:text-white transition-colors">
                        <Search className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-[#2c3e50]">Request a Part</div>
                        <div className="text-xs text-[#5a6c7d]">Ask the community (Coming Soon)</div>
                    </div>
                </button>
            </div>
        </div>
    )
}
