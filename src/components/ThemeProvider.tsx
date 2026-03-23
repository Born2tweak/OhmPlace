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
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'system'
        return (localStorage.getItem('ohm_theme') as Theme | null) || 'system'
    })
    const mounted = typeof window !== 'undefined'
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme

    useEffect(() => {
        if (!mounted) return

        if (theme === 'system') {
            applyTheme(resolvedTheme)

            const mq = window.matchMedia('(prefers-color-scheme: dark)')
            const handler = (e: MediaQueryListEvent) => {
                const r = e.matches ? 'dark' : 'light'
                applyTheme(r)
            }
            mq.addEventListener('change', handler)
            return () => mq.removeEventListener('change', handler)
        } else {
            applyTheme(resolvedTheme)
        }
    }, [mounted, resolvedTheme, theme])

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
