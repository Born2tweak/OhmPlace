'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Send, ArrowLeft, Check, CheckCheck, Loader2, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

type MessageStatus = 'sent' | 'delivered' | 'read'

interface Message {
    id: string
    conversation_id: string
    sender_id: string
    text: string
    status: MessageStatus
    created_at: string
}

interface Conversation {
    id: string
    participant_1: string
    participant_2: string
    last_message_text: string | null
    last_message_at: string
    created_at: string
    other_user?: {
        id: string
        email: string
        full_name?: string
        avatar_url?: string
    }
}

function StatusIcon({ status }: { status?: MessageStatus }) {
    if (!status) return null
    if (status === 'sent') return <Check className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
    return null
}

function MessagesContent() {
    const { user, isLoaded } = useUser()
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createClient()

    // State
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingConvos, setLoadingConvos] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
    const [messageInput, setMessageInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileShowChat, setMobileShowChat] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Initial load
    useEffect(() => {
        if (!isLoaded || !user) return

        const fetchConversations = async () => {
            setLoadingConvos(true)
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
                .order('last_message_at', { ascending: false })

            if (error) {
                console.error('Error fetching conversations:', error)
            } else {
                // 1. Get all participant IDs
                const userIds = new Set<string>()
                data.forEach(c => {
                    userIds.add(c.participant_1)
                    userIds.add(c.participant_2)
                })

                // 2. Fetch profiles from Supabase
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', Array.from(userIds))

                const profileMap = new Map(profiles?.map(p => [p.id, p]))

                // 3. Construct conversation objects
                const enriched = data.map(c => {
                    const otherUserId = c.participant_1 === user.id ? c.participant_2 : c.participant_1
                    const profile = profileMap.get(otherUserId)
                    return {
                        ...c,
                        other_user: {
                            id: otherUserId,
                            email: profile?.email || 'user@campus.edu',
                            full_name: profile?.full_name, // Leave undefined to trigger API fallback
                            avatar_url: profile?.avatar_url
                        }
                    }
                })

                setConversations(enriched as any)

                // 4. Fallback: Fetch missing profiles from API
                const missingIds = enriched
                    .filter(c => !c.other_user.full_name)
                    .map(c => c.other_user.id)

                if (missingIds.length > 0) {
                    const uniqueMissing = Array.from(new Set(missingIds))
                    uniqueMissing.forEach(async (id) => {
                        try {
                            const res = await fetch(`/api/users/${id}`)
                            if (res.ok) {
                                const userData = await res.json()

                                // Update local state for immediate feedback
                                setConversations(prev => prev.map(c => {
                                    if (c.other_user?.id === id) {
                                        return {
                                            ...c,
                                            other_user: {
                                                id: id,
                                                email: userData.email,
                                                full_name: userData.full_name,
                                                avatar_url: userData.avatar_url
                                            }
                                        }
                                    }
                                    return c
                                }))

                                // Sync to Supabase for next time
                                await supabase.from('profiles').upsert({
                                    id: userData.id,
                                    email: userData.email,
                                    full_name: userData.full_name,
                                    avatar_url: userData.avatar_url,
                                    updated_at: new Date().toISOString()
                                })
                            }
                        } catch (err) {
                            console.error(`Failed to fetch user ${id}`, err)
                        }
                    })
                }

                // 5. Handle selection
                const paramId = searchParams.get('id')
                if (paramId && enriched.find(c => c.id === paramId)) {
                    setSelectedConvoId(paramId)
                    setMobileShowChat(true)
                } else if (enriched.length > 0 && !mobileShowChat) {
                    if (window.innerWidth >= 768) {
                        setSelectedConvoId(enriched[0].id)
                    }
                }
            }
            setLoadingConvos(false)
        }

        fetchConversations()

        const channel = supabase
            .channel('conversations')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `participant_1=eq.${user.id}`
            }, () => fetchConversations())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `participant_2=eq.${user.id}`
            }, () => fetchConversations())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, isLoaded])

    // Fetch messages when selected conversation changes
    useEffect(() => {
        if (!selectedConvoId) return

        const fetchMessages = async () => {
            setLoadingMessages(true)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', selectedConvoId)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching messages:', error)
            } else {
                setMessages(data)
            }
            setLoadingMessages(false)
        }

        fetchMessages()

        const channel = supabase
            .channel(`messages:${selectedConvoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${selectedConvoId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedConvoId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loadingMessages])

    const handleSend = async () => {
        if (!messageInput.trim() || !selectedConvoId || !user) return

        const text = messageInput.trim()
        setMessageInput('') // Optimistic clear

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: selectedConvoId,
                sender_id: user.id,
                text: text,
                status: 'sent'
            })

        if (error) {
            console.error('Error sending message:', error)
            alert('Failed to send message')
            setMessageInput(text) // Revert on error
        } else {
            await supabase
                .from('conversations')
                .update({
                    last_message_text: text,
                    last_message_at: new Date().toISOString()
                })
                .eq('id', selectedConvoId)
        }
    }

    const filteredConversations = conversations.filter(c =>
        c.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message_text?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const selectedConvo = conversations.find(c => c.id === selectedConvoId)

    if (!isLoaded || loadingConvos) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-160px)]">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
            </div>
        )
    }

    return (
        <div className="rounded-lg shadow-md overflow-hidden flex h-[calc(100vh-160px)]"
            style={{ background: 'var(--bg-card)' }}>

            {/* Left Sidebar: Conversations */}
            <div className={`w-full md:w-80 md:min-w-[320px] flex flex-col ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}
                style={{ borderRight: '1px solid var(--border-subtle)' }}>
                {/* Header */}
                <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Messages</h2>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search messages"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2"
                            style={{
                                background: 'var(--bg-lighter)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                            No conversations yet
                        </div>
                    ) : (
                        filteredConversations.map((convo) => (
                            <button
                                key={convo.id}
                                onClick={() => {
                                    setSelectedConvoId(convo.id)
                                    setMobileShowChat(true)
                                }}
                                className="w-full flex items-start gap-3 p-4 transition-colors text-left border-l-2"
                                style={{
                                    background: selectedConvoId === convo.id ? 'var(--bg-lighter)' : 'transparent',
                                    borderLeftColor: selectedConvoId === convo.id ? 'var(--brand-primary)' : 'transparent',
                                }}
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                                    style={{ background: 'var(--brand-primary)' }}>
                                    {convo.other_user?.full_name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                            {convo.other_user?.full_name || `User ${convo.other_user?.id.slice(0, 4)}`}
                                        </span>
                                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(convo.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                        {convo.last_message_text || 'Active now'}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Chat */}
            <div className={`flex-1 flex flex-col ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
                {selectedConvo ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b"
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <button
                                onClick={() => setMobileShowChat(false)}
                                className="md:hidden transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                style={{ background: 'var(--brand-primary)' }}>
                                {selectedConvo.other_user?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {selectedConvo.other_user?.full_name || `User ${selectedConvo.other_user?.id.slice(0, 4)}`}
                                </h3>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--bg-lighter)' }}>
                            {loadingMessages ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand-primary)' }} />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                                    No messages yet. Say hi!
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[70%]">
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.sender_id === user?.id ? 'text-white rounded-br-md' : 'rounded-bl-md'
                                                    }`}
                                                style={{
                                                    background: msg.sender_id === user?.id ? 'var(--brand-primary)' : 'var(--bg-card)',
                                                    color: msg.sender_id === user?.id ? '#ffffff' : 'var(--text-primary)',
                                                    border: msg.sender_id === user?.id ? 'none' : '1px solid var(--border-subtle)'
                                                }}
                                            >
                                                {msg.text}
                                            </div>
                                            <div className={`flex items-center gap-1 mt-1 text-[10px] ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                                                }`} style={{ color: 'var(--text-muted)' }}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                {msg.sender_id === user?.id && <StatusIcon status={msg.status} />}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2"
                                    style={{
                                        background: 'var(--bg-lighter)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!messageInput.trim()}
                                    className="p-2.5 rounded-full transition-colors disabled:opacity-50"
                                    style={{
                                        background: messageInput.trim() ? 'var(--brand-primary)' : 'var(--bg-lighter)',
                                        color: messageInput.trim() ? '#ffffff' : 'var(--text-secondary)'
                                    }}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ background: 'var(--bg-lighter)' }}>
                            <MessageSquare className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Your Messages</h3>
                        <p className="text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                            Select a conversation to start chatting or browse the marketplace to find items.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[calc(100vh-160px)]">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    )
}
