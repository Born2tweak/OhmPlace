'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => { },
    resolvedTheme: 'light',
})

export function useTheme() {
    return useContext(ThemeContext)
}

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: 'light' | 'dark') {
    if (resolved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
    } else {
        document.documentElement.removeAttribute('data-theme')
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system')
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
    const [mounted, setMounted] = useState(false)

    // Load saved theme on mount
    useEffect(() => {
        const saved = localStorage.getItem('ohm_theme') as Theme | null
        if (saved) setThemeState(saved)
        setMounted(true)
    }, [])

    // Apply theme to DOM
    useEffect(() => {
        if (!mounted) return

        if (theme === 'system') {
            const resolved = getSystemTheme()
            setResolvedTheme(resolved)
            applyTheme(resolved)

            const mq = window.matchMedia('(prefers-color-scheme: dark)')
            const handler = (e: MediaQueryListEvent) => {
                const r = e.matches ? 'dark' : 'light'
                setResolvedTheme(r)
                applyTheme(r)
            }
            mq.addEventListener('change', handler)
            return () => mq.removeEventListener('change', handler)
        } else {
            setResolvedTheme(theme)
            applyTheme(theme)
        }
    }, [theme, mounted])

    const setTheme = (t: Theme) => {
        setThemeState(t)
        localStorage.setItem('ohm_theme', t)
    }

    if (!mounted) {
        return <>{children}</>
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
