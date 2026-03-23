'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Send, ArrowLeft, Check, CheckCheck, Loader2, MessageSquare, ShoppingBag, Plus, X, UserPlus } from 'lucide-react'
import { useToast } from '@/components/Toast'
import Link from 'next/link'

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
    const { toast } = useToast()

    // State
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingConvos, setLoadingConvos] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
    const [messageInput, setMessageInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileShowChat, setMobileShowChat] = useState(false)

    // New conversation modal state
    const [showNewConvo, setShowNewConvo] = useState(false)
    const [userSearchQuery, setUserSearchQuery] = useState('')
    const [userSearchResults, setUserSearchResults] = useState<{ id: string; full_name: string; avatar_url: string }[]>([])
    const [searchingUsers, setSearchingUsers] = useState(false)
    const [startingConvo, setStartingConvo] = useState(false)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch conversations via API
    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/conversations')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()

            setConversations(data)

            // Fallback: Fetch missing profiles from API
            const missingIds = data
                .filter((c: any) => !c.other_user?.full_name || !c.other_user?.avatar_url)
                .map((c: any) => c.other_user?.id)

            if (missingIds.length > 0) {
                const uniqueMissing = Array.from(new Set(missingIds)) as string[]
                uniqueMissing.forEach(async (id) => {
                    try {
                        const res = await fetch(`/api/users/${id}`)
                        if (res.ok) {
                            const userData = await res.json()
                            setConversations(prev => prev.map((c: any) => {
                                if (c.other_user?.id === id) {
                                    return {
                                        ...c,
                                        other_user: {
                                            id: id as string,
                                            email: userData.email,
                                            full_name: userData.full_name,
                                            avatar_url: userData.avatar_url
                                        }
                                    }
                                }
                                return c
                            }))
                        }
                    } catch (err) {
                        console.error(`Failed to fetch user ${id}`, err)
                    }
                })
            }

            return data
        } catch (err) {
            console.error('Error fetching conversations:', err)
            return []
        }
    }

    // Fetch messages via API
    const fetchMessages = async (convoId: string) => {
        try {
            const res = await fetch(`/api/conversations/${convoId}/messages`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setMessages(data)
        } catch (err) {
            console.error('Error fetching messages:', err)
        }
    }

    // Initial load
    useEffect(() => {
        if (!isLoaded || !user) return

        const init = async () => {
            setLoadingConvos(true)
            const data = await fetchConversations()
            setLoadingConvos(false)

            // Handle selection
            const paramId = searchParams.get('id')
            if (paramId && data.find((c: any) => c.id === paramId)) {
                setSelectedConvoId(paramId)
                setMobileShowChat(true)
            } else if (data.length > 0 && !mobileShowChat) {
                if (window.innerWidth >= 768) {
                    setSelectedConvoId(data[0].id)
                }
            }
        }

        init()
    }, [user, isLoaded])

    // Fetch messages when conversation changes + set up polling
    useEffect(() => {
        if (!selectedConvoId) return

        const loadMessages = async () => {
            setLoadingMessages(true)
            await fetchMessages(selectedConvoId)
            setLoadingMessages(false)
        }

        loadMessages()

        // Mark messages as read
        fetch(`/api/conversations/${selectedConvoId}/messages/read`, { method: 'PATCH' }).catch(() => {})

        // Poll for new messages every 3 seconds
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = setInterval(() => {
            fetchMessages(selectedConvoId)
            // Also refresh conversations for updated last_message_text
            fetchConversations()
        }, 3000)

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [selectedConvoId])

    // Mark as read when message count changes
    useEffect(() => {
        if (!selectedConvoId || !user) return
        fetch(`/api/conversations/${selectedConvoId}/messages/read`, { method: 'PATCH' }).catch(() => {})
    }, [messages.length])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loadingMessages])

    const handleSend = async () => {
        if (!messageInput.trim() || !selectedConvoId || !user) return

        const text = messageInput.trim()
        setMessageInput('') // Optimistic clear

        // Optimistic add
        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            conversation_id: selectedConvoId,
            sender_id: user.id,
            text,
            status: 'sent',
            created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, optimisticMsg])

        try {
            const res = await fetch(`/api/conversations/${selectedConvoId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            })

            if (!res.ok) {
                throw new Error('Failed to send')
            }

            const sentMessage = await res.json()
            // Replace the optimistic message with the real one
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? sentMessage : m))

            // Update conversation list
            setConversations(prev => prev.map(c =>
                c.id === selectedConvoId
                    ? { ...c, last_message_text: text, last_message_at: new Date().toISOString() }
                    : c
            ))
        } catch (error) {
            console.error('Error sending message:', error)
            toast('Failed to send message', 'error')
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
            setMessageInput(text) // Revert
        }
    }

    const filteredConversations = conversations.filter(c =>
        c.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message_text?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleUserSearch = (query: string) => {
        setUserSearchQuery(query)
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        if (query.trim().length < 2) {
            setUserSearchResults([])
            return
        }
        setSearchingUsers(true)
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
                if (res.ok) {
                    const data = await res.json()
                    setUserSearchResults(data)
                }
            } catch (err) {
                console.error('User search error:', err)
            } finally {
                setSearchingUsers(false)
            }
        }, 300)
    }

    const startNewConversation = async (participantId: string) => {
        setStartingConvo(true)
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setShowNewConvo(false)
            setUserSearchQuery('')
            setUserSearchResults([])

            // Refresh conversations and select the new one
            setSelectedConvoId(data.conversationId)
            setMobileShowChat(true)
            // Re-fetch conversations to include the new one
            window.location.href = `/dashboard/messages?id=${data.conversationId}`
        } catch (error: any) {
            toast(error.message || 'Failed to start conversation', 'error')
        } finally {
            setStartingConvo(false)
        }
    }

    const selectedConvo = conversations.find((c: any) => c.id === selectedConvoId)

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
                        <button
                            onClick={() => setShowNewConvo(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            style={{ background: 'var(--brand-primary)', color: '#fff' }}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">New</span>
                        </button>
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
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--bg-lighter)' }}>
                                <MessageSquare className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>No conversations yet</p>
                            <Link
                                href="/dashboard/marketplace"
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full text-white transition-all hover:opacity-90"
                                style={{ background: 'var(--brand-primary)' }}
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Browse Marketplace
                            </Link>
                        </div>
                    ) : (
                        filteredConversations.map((convo) => {
                            const handleSwipeStart = (e: React.TouchEvent<HTMLDivElement>) => {
                                const el = e.currentTarget;
                                (el as any)._startX = e.touches[0].clientX;
                                (el as any)._startY = e.touches[0].clientY;
                                (el as any)._swiping = false;
                            }
                            const handleSwipeMove = (e: React.TouchEvent<HTMLDivElement>) => {
                                const el = e.currentTarget;
                                const startX = (el as any)._startX;
                                const startY = (el as any)._startY;
                                if (startX == null) return;
                                const diffX = e.touches[0].clientX - startX;
                                const diffY = e.touches[0].clientY - startY;
                                // Only swipe if horizontal
                                if (Math.abs(diffX) > Math.abs(diffY) && diffX < 0) {
                                    (el as any)._swiping = true;
                                    const clamped = Math.max(diffX, -80);
                                    const inner = el.querySelector('[data-swipe-inner]') as HTMLElement;
                                    if (inner) {
                                        inner.style.transform = `translateX(${clamped}px)`;
                                        inner.style.transition = 'none';
                                    }
                                }
                            }
                            const handleSwipeEnd = (e: React.TouchEvent<HTMLDivElement>) => {
                                const el = e.currentTarget;
                                const startX = (el as any)._startX;
                                if (startX == null) return;
                                const diffX = e.changedTouches[0].clientX - startX;
                                const inner = el.querySelector('[data-swipe-inner]') as HTMLElement;
                                if (inner) {
                                    inner.style.transition = 'transform 0.3s ease';
                                    inner.style.transform = diffX < -50 ? 'translateX(-72px)' : 'translateX(0px)';
                                }
                                (el as any)._startX = null;
                            }

                            return (
                                <div
                                    key={convo.id}
                                    className="relative overflow-hidden"
                                    onTouchStart={handleSwipeStart}
                                    onTouchMove={handleSwipeMove}
                                    onTouchEnd={handleSwipeEnd}
                                >
                                    {/* Swipe-reveal action */}
                                    <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-red-500 text-white text-xs font-semibold"
                                        onClick={() => {
                                            // Archive (remove from local state)
                                            setConversations(prev => prev.filter(c => c.id !== convo.id))
                                            if (selectedConvoId === convo.id) {
                                                setSelectedConvoId(null)
                                                setMobileShowChat(false)
                                            }
                                        }}
                                    >
                                        Archive
                                    </div>

                                    {/* Conversation item */}
                                    <div
                                        data-swipe-inner
                                        className="relative"
                                        style={{ background: 'var(--bg-card)', transition: 'transform 0.3s ease' }}
                                    >
                                        <button
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
                                            {convo.other_user?.avatar_url ? (
                                                <img src={convo.other_user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                                                    style={{ background: 'var(--brand-primary)' }}>
                                                    {convo.other_user?.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
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
                                    </div>
                                </div>
                            )
                        })
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
                            {selectedConvo.other_user?.avatar_url ? (
                                <img src={selectedConvo.other_user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                    style={{ background: 'var(--brand-primary)' }}>
                                    {selectedConvo.other_user?.full_name?.charAt(0) || '?'}
                                </div>
                            )}
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

            {/* New Conversation Modal */}
            {showNewConvo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowNewConvo(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative w-full max-w-md rounded-2xl shadow-xl p-6"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>New Conversation</h3>
                            <button onClick={() => setShowNewConvo(false)} className="p-1 rounded-full" style={{ color: 'var(--text-muted)' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search users by name..."
                                value={userSearchQuery}
                                onChange={e => handleUserSearch(e.target.value)}
                                autoFocus
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                                style={{ background: 'var(--bg-lighter)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {searchingUsers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand-primary)' }} />
                                </div>
                            ) : userSearchResults.length > 0 ? (
                                userSearchResults.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => startNewConversation(u.id)}
                                        disabled={startingConvo}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:opacity-80 disabled:opacity-50"
                                        style={{ background: 'var(--bg-lighter)' }}
                                    >
                                        {u.avatar_url ? (
                                            <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                                style={{ background: 'var(--brand-primary)' }}>
                                                {(u.full_name || '?')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.full_name}</p>
                                        </div>
                                        {startingConvo && <Loader2 className="w-4 h-4 animate-spin ml-auto" style={{ color: 'var(--brand-primary)' }} />}
                                    </button>
                                ))
                            ) : userSearchQuery.trim().length >= 2 ? (
                                <div className="text-center py-8">
                                    <UserPlus className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users found</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Type at least 2 characters to search</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
