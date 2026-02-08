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
                    colorPrimary: '#f59e0b',
                    colorBackground: '#ffffff',
                    colorInputBackground: '#f9fafb',
                    colorInputText: '#1f2937',
                    colorText: '#1f2937',
                    colorTextSecondary: '#6b7280',
                },
            }}
        >
            <html lang="en">
                <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                    {children}
                </body>
            </html>
        </ClerkProvider>
    )
}
