'use client'

import { useState } from 'react'
import { GraduationCap, Loader2 } from 'lucide-react'
import { SUPPORTED_CAMPUSES } from '@/lib/campus'

interface CampusGateProps {
    onCampusSet: (campus: string) => void
}

export default function CampusGate({ onCampusSet }: CampusGateProps) {
    const [selected, setSelected] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async () => {
        if (!selected) return
        setSaving(true)
        setError('')
        try {
            const res = await fetch('/api/profile/campus', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campus: selected }),
            })
            if (!res.ok) {
                const data = await res.json() as { error?: string }
                throw new Error(data.error || 'Failed to save')
            }
            onCampusSet(selected)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}>
                    <GraduationCap className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    What school are you at?
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    OhmPlace connects engineers at your campus. You&apos;ll only see listings and posts from your school.
                </p>

                <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 mb-4"
                    style={{
                        background: 'var(--bg-lighter)',
                        border: '1px solid var(--border-subtle)',
                        color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                >
                    <option value="" disabled>Select your school...</option>
                    {SUPPORTED_CAMPUSES.map(campus => (
                        <option key={campus} value={campus}>{campus}</option>
                    ))}
                </select>

                {error && (
                    <p className="text-sm text-red-500 mb-4">{error}</p>
                )}

                <button
                    onClick={handleSave}
                    disabled={!selected || saving}
                    className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
                >
                    {saving ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </span>
                    ) : (
                        'Get Started'
                    )}
                </button>
            </div>
        </div>
    )
}
