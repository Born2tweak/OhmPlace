'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-2xl"
                        style={{ background: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}>
                        ⚡
                    </div>
                    <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Something went wrong
                    </h2>
                    <p className="text-sm mb-4 max-w-md" style={{ color: 'var(--text-secondary)' }}>
                        An unexpected error occurred. Try refreshing the page.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02]"
                        style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
                    >
                        Try Again
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
