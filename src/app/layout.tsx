import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "OhmPlace | Campus Marketplace",
    description: "Buy, sell, and trade with students on your campus.",
    icons: {
        icon: [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: '/apple-touch-icon.png',
        other: [
            { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
            { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
        ],
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <ClerkProvider
            appearance={{
                variables: {
                    colorPrimary: '#22c1c3',
                    colorBackground: '#ffffff',
                    colorInputBackground: '#f4fafb',
                    colorInputText: '#2c3e50',
                    colorText: '#2c3e50',
                    colorTextSecondary: '#5a6c7d',
                },
            }}
        >
            <html lang="en" suppressHydrationWarning>
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                    suppressHydrationWarning
                >
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    )
}
