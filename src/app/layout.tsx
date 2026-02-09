import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
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
                    {children}
                </body>
            </html>
        </ClerkProvider>
    )
}
