'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import {
    User, Mail, GraduationCap, BookOpen, Shield,
    Bell, Palette, LogOut, ChevronRight, CheckCircle,
    AlertCircle, Camera, Loader2, Lock, Trash2
} from 'lucide-react'
import AvatarCropModal from '@/components/settings/AvatarCropModal'
import { useToast } from '@/components/Toast'
import { useTheme } from '@/components/ThemeProvider'

type Section = 'profile' | 'account' | 'notifications' | 'appearance'

interface Profile {
    username: string
    email: string
    campus: string
    bio: string
    major: string
    year: string
    avatar_url: string
}

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD', 'Faculty', 'Alumni']

export default function SettingsPage() {
    const { user } = useUser()
    const { signOut, openUserProfile } = useClerk()

    const [activeSection, setActiveSection] = useState<Section>('profile')
    const [profile, setProfile] = useState<Profile>({
        username: '',
        email: '',
        campus: '',
        bio: '',
        major: '',
        year: '',
        avatar_url: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()
    const { theme, setTheme } = useTheme()

    // Avatar crop
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [cropImage, setCropImage] = useState<string | null>(null)
    const [showCropModal, setShowCropModal] = useState(false)
    const [avatarUploading, setAvatarUploading] = useState(false)

    // Notification prefs (stored in localStorage for now)
    const [notifPrefs, setNotifPrefs] = useState({
        newMessages: true,
        postReplies: true,
        marketplaceOffers: true,
        communityActivity: false,
        emailDigest: false,
    })

    // Appearance removed from local state, managed by ThemeProvider

    useEffect(() => {
        fetchProfile()
        const savedNotifs = localStorage.getItem('ohm_notif_prefs')
        if (savedNotifs) setNotifPrefs(JSON.parse(savedNotifs))
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/settings/profile')
            if (res.ok) {
                const data = await res.json()
                setProfile({
                    username: data.username || user?.fullName || '',
                    email: data.email || user?.primaryEmailAddress?.emailAddress || '',
                    campus: data.campus || '',
                    bio: data.bio || '',
                    major: data.major || '',
                    year: data.year || '',
                    avatar_url: data.avatar_url || '',
                })
            }
        } catch {
            setProfile(prev => ({
                ...prev,
                username: user?.fullName || '',
                email: user?.primaryEmailAddress?.emailAddress || '',
            }))
        } finally {
            setLoading(false)
        }
    }


    const saveProfile = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: profile.username,
                    bio: profile.bio,
                    major: profile.major,
                    year: profile.year,
                }),
            })
            if (res.ok) toast('Profile saved successfully!', 'success')
            else toast('Failed to save profile.', 'error')
        } catch {
            toast('Network error. Please try again.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            toast('Image must be under 5MB', 'error')
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            setCropImage(reader.result as string)
            setShowCropModal(true)
        }
        reader.readAsDataURL(file)
        // Reset so same file can be re-selected
        e.target.value = ''
    }

    const handleCroppedSave = async (blob: Blob) => {
        setAvatarUploading(true)
        try {
            const formData = new FormData()
            formData.append('avatar', blob, 'avatar.webp')
            const res = await fetch('/api/settings/avatar', { method: 'POST', body: formData })
            if (res.ok) {
                const data = await res.json()
                setProfile(p => ({ ...p, avatar_url: data.avatar_url }))
                toast('Photo updated!', 'success')
            } else {
                const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
                console.error('[avatar] Upload failed:', res.status, errData)
                toast(`Upload failed: ${errData.error || res.statusText}`, 'error')
            }
        } catch (err) {
            console.error('[avatar] Network error:', err)
            toast('Network error uploading photo.', 'error')
        } finally {
            setAvatarUploading(false)
            setShowCropModal(false)
            setCropImage(null)
        }
    }

    const saveNotifications = () => {
        localStorage.setItem('ohm_notif_prefs', JSON.stringify(notifPrefs))
        toast('Notification preferences saved!', 'success')
    }

    const saveAppearance = (newTheme: 'system' | 'light' | 'dark') => {
        setTheme(newTheme)
        toast('Appearance settings saved!', 'success')
    }

    const navItems: { key: Section; label: string; icon: React.ReactNode; desc: string }[] = [
        { key: 'profile', label: 'Profile', icon: <User className="w-4 h-4" />, desc: 'Your public info' },
        { key: 'account', label: 'Account', icon: <Shield className="w-4 h-4" />, desc: 'Security & login' },
        { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, desc: 'What you hear about' },
        { key: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" />, desc: 'Theme & display' },
    ]

    const currentAvatarUrl = profile.avatar_url || user?.imageUrl || ''

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} className="hidden" />

            {/* Crop modal */}
            {cropImage && (
                <AvatarCropModal
                    imageUrl={cropImage}
                    isOpen={showCropModal}
                    onClose={() => { setShowCropModal(false); setCropImage(null) }}
                    onSave={handleCroppedSave}
                />
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your account and preferences</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar nav */}
                <div className="w-52 shrink-0">
                    <nav className="space-y-1">
                        {navItems.map(({ key, label, icon, desc }) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(key)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group cursor-pointer"
                                style={{
                                    background: activeSection === key
                                        ? 'color-mix(in srgb, var(--brand-primary) 10%, transparent)'
                                        : 'transparent',
                                    color: activeSection === key ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                    border: activeSection === key
                                        ? '1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)'
                                        : '1px solid transparent',
                                }}
                            >
                                <span className="shrink-0">{icon}</span>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium">{label}</div>
                                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                                </div>
                            </button>
                        ))}

                        <div style={{ borderTop: '1px solid var(--border-subtle)' }} className="pt-2 mt-2">
                            <button
                                onClick={() => signOut({ redirectUrl: '/' })}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group cursor-pointer"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'color-mix(in srgb, #ef4444 10%, transparent)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                            >
                                <LogOut className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-red-500">Sign Out</span>
                            </button>
                        </div>
                    </nav>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">

                    {/* ── PROFILE ── */}
                    {activeSection === 'profile' && (
                        <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            {/* Avatar section */}
                            <div className="p-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Profile Photo</h2>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        {currentAvatarUrl ? (
                                            <img src={currentAvatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-[var(--border-subtle)]" />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'var(--brand-primary)' }}>
                                                {profile.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={avatarUploading}
                                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-opacity hover:opacity-80 cursor-pointer"
                                            style={{ background: 'var(--brand-primary)' }}
                                            title="Upload & crop a new photo"
                                        >
                                            {avatarUploading
                                                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                                : <Camera className="w-3.5 h-3.5 text-white" />}
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {profile.username || 'Your Name'}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{profile.campus || 'Campus'}</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs mt-1 font-medium hover:underline cursor-pointer"
                                            style={{ color: 'var(--brand-primary)' }}
                                        >
                                            Upload & crop photo →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Form fields */}
                            <div className="p-6 space-y-5">
                                <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Profile Info</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Display name */}
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            <User className="w-3.5 h-3.5 inline mr-1" />Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.username}
                                            onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                                            style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                                        />
                                    </div>



                                    {/* Email (read-only) */}
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            <Mail className="w-3.5 h-3.5 inline mr-1" />Email
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={profile.email}
                                                readOnly
                                                className="w-full px-3 py-2.5 rounded-lg text-sm cursor-not-allowed"
                                                style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', opacity: 0.7 }}
                                            />
                                            <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    </div>

                                    {/* Campus (read-only) */}
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            <GraduationCap className="w-3.5 h-3.5 inline mr-1" />Campus
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={profile.campus}
                                                readOnly
                                                className="w-full px-3 py-2.5 rounded-lg text-sm cursor-not-allowed"
                                                style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', opacity: 0.7 }}
                                            />
                                            <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Determined by your university email</p>
                                    </div>

                                    {/* Year */}
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            Year
                                        </label>
                                        <select
                                            value={profile.year}
                                            onChange={e => setProfile(p => ({ ...p, year: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all cursor-pointer"
                                            style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="">Select year...</option>
                                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>

                                    {/* Major */}
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            <BookOpen className="w-3.5 h-3.5 inline mr-1" />Major / Program
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.major}
                                            onChange={e => setProfile(p => ({ ...p, major: e.target.value }))}
                                            placeholder="e.g. Computer Science, Business, etc."
                                            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                                            style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            Bio
                                        </label>
                                        <textarea
                                            value={profile.bio}
                                            onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                            maxLength={200}
                                            rows={3}
                                            placeholder="Tell your campus a little about yourself..."
                                            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                                            style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                                        />
                                        <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{profile.bio.length}/200</p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={saveProfile}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-full text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
                                        style={{ background: 'var(--brand-primary)' }}
                                    >
                                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        {saving ? 'Saving...' : 'Save Profile'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ACCOUNT ── */}
                    {activeSection === 'account' && (
                        <div className="space-y-4">
                            <div className="rounded-xl shadow-sm p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                                <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account Security</h2>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Change Password', desc: 'Update your login password', icon: <Lock className="w-4 h-4" /> },
                                        { label: 'Connected Accounts', desc: 'Google, GitHub, and more', icon: <Shield className="w-4 h-4" /> },
                                    ].map(({ label, desc, icon }) => (
                                        <button
                                            key={label}
                                            onClick={() => openUserProfile()}
                                            className="w-full flex items-center justify-between p-4 rounded-xl transition-all hover:opacity-80 cursor-pointer group"
                                            style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }}>
                                                    {icon}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                                    Security settings are managed via Clerk. Click any option above to open the account portal.
                                </p>
                            </div>

                            {/* Danger zone */}
                            <div className="rounded-xl p-6" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <h2 className="text-base font-semibold text-red-500 mb-1">Danger Zone</h2>
                                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>These actions are irreversible. Proceed with caution.</p>
                                <button
                                    onClick={() => openUserProfile()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-500 transition-all cursor-pointer"
                                    style={{ border: '1px solid rgba(239,68,68,0.3)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, #ef4444 10%, transparent)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── NOTIFICATIONS ── */}
                    {activeSection === 'notifications' && (
                        <div className="rounded-xl shadow-sm p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h2>
                            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Choose what you want to be notified about</p>

                            <div className="space-y-1">
                                {(Object.entries({
                                    newMessages: { label: 'New Messages', desc: 'When someone sends you a direct message' },
                                    postReplies: { label: 'Post Replies', desc: 'When someone comments on your posts' },
                                    marketplaceOffers: { label: 'Marketplace Offers', desc: 'When someone makes an offer on your listing' },
                                    communityActivity: { label: 'Community Activity', desc: 'Hot posts and community highlights' },
                                    emailDigest: { label: 'Weekly Email Digest', desc: 'A weekly summary of activity on your campus' },
                                }) as [keyof typeof notifPrefs, { label: string; desc: string }][]).map(([key, { label, desc }]) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between p-4 rounded-xl transition-all"
                                        style={{ border: '1px solid var(--border-subtle)' }}
                                    >
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                                        </div>
                                        <button
                                            onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))}
                                            className={`relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer shrink-0`}
                                            style={{ background: notifPrefs[key] ? 'var(--brand-primary)' : 'var(--border-subtle)' }}
                                        >
                                            <span
                                                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                                                style={{ left: notifPrefs[key] ? '22px' : '2px' }}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end mt-5">
                                <button
                                    onClick={saveNotifications}
                                    className="px-5 py-2.5 text-white font-semibold rounded-full text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                                    style={{ background: 'var(--brand-primary)' }}
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── APPEARANCE ── */}
                    {activeSection === 'appearance' && (
                        <div className="rounded-xl shadow-sm p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
                            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Choose how OhmPlace looks for you</p>

                            <div>
                                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Theme</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {([
                                        { key: 'system', label: 'System', preview: 'Auto' },
                                        { key: 'light', label: 'Light', preview: '☀️' },
                                        { key: 'dark', label: 'Dark', preview: '🌙' },
                                    ] as { key: 'system' | 'light' | 'dark'; label: string; preview: string }[]).map(({ key, label, preview }) => (
                                        <button
                                            key={key}
                                            onClick={() => saveAppearance(key)}
                                            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all cursor-pointer"
                                            style={{
                                                border: theme === key
                                                    ? '2px solid var(--brand-primary)'
                                                    : '2px solid var(--border-subtle)',
                                                background: theme === key
                                                    ? 'color-mix(in srgb, var(--brand-primary) 8%, transparent)'
                                                    : 'var(--bg-lighter)',
                                            }}
                                        >
                                            <span className="text-2xl">{preview}</span>
                                            <span className="text-xs font-medium" style={{ color: theme === key ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                                                {label}
                                            </span>
                                            {theme === key && (
                                                <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                                    Theme preference is saved locally. Full dark/light mode switching requires theme integration.
                                </p>
                            </div>


                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
