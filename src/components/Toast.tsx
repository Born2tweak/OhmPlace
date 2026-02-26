'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
    exiting?: boolean
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
    return useContext(ToastContext)
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
}

const colors = {
    success: { bg: 'rgba(34, 197, 94, 0.12)', border: '#22c55e', text: '#16a34a', icon: '#22c55e' },
    error: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', text: '#dc2626', icon: '#ef4444' },
    info: { bg: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)', border: 'var(--brand-primary)', text: 'var(--brand-accent)', icon: 'var(--brand-primary)' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        setToasts(prev => [...prev, { id, message, type, duration }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 300)
    }, [])

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
                style={{ maxWidth: '380px', width: '100%' }}>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onDismiss }: { toast: Toast, onDismiss: () => void }) {
    const Icon = icons[toast.type]
    const color = colors[toast.type]

    useEffect(() => {
        const timer = setTimeout(onDismiss, toast.duration || 4000)
        return () => clearTimeout(timer)
    }, [toast.duration, onDismiss])

    return (
        <div
            className="pointer-events-auto rounded-xl p-4 shadow-lg backdrop-blur-md flex items-start gap-3 relative overflow-hidden"
            style={{
                background: color.bg,
                border: `1px solid ${color.border}`,
                animation: toast.exiting ? 'slideOutRight 0.3s ease-in forwards' : 'slideInRight 0.3s ease-out',
            }}
        >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: color.icon }} />
            <p className="text-sm font-medium flex-1" style={{ color: color.text }}>
                {toast.message}
            </p>
            <button
                onClick={onDismiss}
                className="flex-shrink-0 p-0.5 rounded-full transition-colors hover:opacity-70"
                style={{ color: color.text }}
            >
                <X className="w-4 h-4" />
            </button>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-[3px] rounded-full"
                style={{
                    background: color.border,
                    animation: `progressShrink ${toast.duration || 4000}ms linear forwards`,
                }}
            />
        </div>
    )
}
