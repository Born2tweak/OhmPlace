'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface StatsCardProps {
    title: string
    value: string | number
    icon?: React.ReactNode
    trend?: string
    href?: string
}

function useCountUp(target: number, duration = 1200): number {
    const [count, setCount] = useState(0)
    const startTimeRef = useRef<number | null>(null)
    const rafRef = useRef<number>(0)

    useEffect(() => {
        if (target === 0) {
            setCount(0)
            return
        }

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp
            const elapsed = timestamp - startTimeRef.current
            const progress = Math.min(elapsed / duration, 1)

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate)
            }
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => {
            cancelAnimationFrame(rafRef.current)
            startTimeRef.current = null
        }
    }, [target, duration])

    return count
}

export default function StatsCard({ title, value, icon, trend, href }: StatsCardProps) {
    const numericValue = typeof value === 'number' ? value : parseInt(value, 10)
    const isNumeric = !isNaN(numericValue)
    const displayValue = useCountUp(isNumeric ? numericValue : 0)

    const content = (
        <div className={`rounded-xl p-6 shadow-sm flex flex-col items-center text-center hover-lift ${href ? 'cursor-pointer' : ''}`}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            {icon && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                    style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }}>
                    {icon}
                </div>
            )}
            <h3 className="text-sm font-medium mb-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
            <div className="text-3xl font-bold mb-1 tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {isNumeric ? displayValue : value}
            </div>
            {trend && (
                <span className="text-xs font-medium px-2 py-1 rounded-full animate-fade-in-up"
                    style={{ color: 'var(--brand-primary)', background: 'var(--bg-lighter)' }}>
                    {trend}
                </span>
            )}
        </div>
    )

    if (href) {
        return <Link href={href} className="block">{content}</Link>
    }

    return content
}
