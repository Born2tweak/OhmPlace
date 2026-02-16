'use client'

import React from 'react'

interface StatsCardProps {
    title: string
    value: string | number
    icon?: React.ReactNode
    trend?: string
}

export default function StatsCard({ title, value, icon, trend }: StatsCardProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#d4e8ea] flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <h3 className="text-sm font-medium text-[#5a6c7d] mb-1 uppercase tracking-wider">{title}</h3>
            <div className="text-3xl font-bold text-[#2c3e50] mb-1">{value}</div>
            {trend && (
                <span className="text-xs text-[#22c1c3] font-medium bg-[#e8f4f5] px-2 py-1 rounded-full">
                    {trend}
                </span>
            )}
        </div>
    )
}
