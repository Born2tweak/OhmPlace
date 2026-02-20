'use client'

import React from 'react'
import { Bell, Star, ShoppingBag, ShieldCheck } from 'lucide-react'

export default function ActivityFeed() {
    const activities = [
        {
            id: 1,
            type: 'listing',
            title: 'Arduino Mega Listed',
            description: 'Sam L. just posted in Microcontrollers',
            time: '2m ago',
            icon: ShoppingBag,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            id: 2,
            type: 'review',
            title: 'New Review',
            description: '"Great seller, very fast meetup!" for Sensors Pro',
            time: '15m ago',
            icon: Star,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10'
        },
        {
            id: 3,
            type: 'system',
            title: 'Request Fulfilled',
            description: 'The 10k Ohm Resistor request by Jane D. was closed',
            time: '1h ago',
            icon: Bell,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            id: 4,
            type: 'system',
            title: 'System Update',
            description: 'Marketplace safety guidelines updated for 2024',
            time: '5h ago',
            icon: ShieldCheck,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        }
    ]

    return (
        <div className="rounded-xl p-6 shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>

            <div className="space-y-6">
                {activities.map((activity) => {
                    const Icon = activity.icon
                    return (
                        <div key={activity.id} className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full ${activity.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                <Icon className={`w-4 h-4 ${activity.color}`} />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activity.title}</h4>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{activity.description}</p>
                                <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>{activity.time}</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--brand-primary)' }}>
                    View All Activity
                </button>
            </div>
        </div>
    )
}
