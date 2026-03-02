'use client'

import React, { useState, useRef, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
    onRefresh: () => Promise<void>
    children: React.ReactNode
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [pulling, setPulling] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [pullDistance, setPullDistance] = useState(0)
    const startY = useRef(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const threshold = 80

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only enable pull-to-refresh when scrolled to top
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            startY.current = e.touches[0].clientY
            setPulling(true)
        }
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!pulling || refreshing) return

        const currentY = e.touches[0].clientY
        const diff = currentY - startY.current

        if (diff > 0) {
            // Apply diminishing returns for over-pull
            const dampened = Math.min(diff * 0.4, 120)
            setPullDistance(dampened)
        }
    }, [pulling, refreshing])

    const handleTouchEnd = useCallback(async () => {
        if (!pulling) return
        setPulling(false)

        if (pullDistance >= threshold && !refreshing) {
            setRefreshing(true)
            setPullDistance(threshold * 0.5)

            try {
                await onRefresh()
            } catch (err) {
                console.error('Refresh error:', err)
            }

            setPullDistance(0)
            setRefreshing(false)
        } else {
            setPullDistance(0)
        }
    }, [pulling, pullDistance, refreshing, onRefresh])

    const progress = Math.min(pullDistance / threshold, 1)

    return (
        <div
            ref={containerRef}
            className="relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            <div
                className="flex items-center justify-center overflow-hidden transition-all duration-200"
                style={{
                    height: pullDistance > 0 ? `${pullDistance}px` : '0px',
                    opacity: progress,
                }}
            >
                <div
                    className={`flex items-center gap-2 text-sm font-medium ${refreshing ? 'refresh-spinner' : ''}`}
                    style={{
                        color: 'var(--brand-primary)',
                        transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
                    }}
                >
                    <RefreshCw className="w-5 h-5" />
                </div>
            </div>

            {children}
        </div>
    )
}
