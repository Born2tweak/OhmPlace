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
        <div className="rounded-xl p-6 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-medium mb-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
            {trend && (
                <span className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ color: 'var(--brand-primary)', background: 'var(--bg-lighter)' }}>
                    {trend}
                </span>
            )}
        </div>
    )
}
