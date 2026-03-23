'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Send, ArrowLeft, Check, CheckCheck, Loader2, MessageSquare, ShoppingBag } from 'lucide-react'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import type { Conversation as ConversationRow, Message, Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

type MessageStatus = Message['status']
type SupabaseBrowserClient = ReturnType<typeof createClient>
type ConversationWithUser = ConversationRow & {
    other_user?: {
        id: string
        email: string
        full_name?: string
        avatar_url?: string
    }
}
type ConversationPayload = {
    new: Message
}
type SwipeState = {
    startX: number | null
    startY: number | null
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
    const { session } = useSession()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [supabase, setSupabase] = useState<SupabaseBrowserClient | null>(null)
    const [conversations, setConversations] = useState<ConversationWithUser[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingConvos, setLoadingConvos] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
    const [messageInput, setMessageInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileShowChat, setMobileShowChat] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const swipeStateRef = useRef<Record<string, SwipeState>>({})

    useEffect(() => {
        if (!isLoaded || !session) return

        let isMounted = true
        const initSupabase = async () => {
            try {
                const token = await session.getToken({ template: 'supabase' })
                if (isMounted) {
                    setSupabase(createClient(token || undefined))
                }
            } catch (err) {
                console.error('Failed to fetch Clerk Supabase token:', err)
                if (isMounted) toast('Authentication error. Please refresh.', 'error')
            }
        }

        void initSupabase()
        return () => {
            isMounted = false
        }
    }, [isLoaded, session, toast])

    useEffect(() => {
        if (!isLoaded || !user || !supabase) return

        const fetchConversations = async () => {
            setLoadingConvos(true)

            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
                .order('last_message_at', { ascending: false })

            if (error || !data) {
                console.error('Error fetching conversations:', error)
                setLoadingConvos(false)
                return
            }

            const userIds = new Set<string>()
            data.forEach((conversation) => {
                userIds.add(conversation.participant_1)
                userIds.add(conversation.participant_2)
            })

            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .in('id', Array.from(userIds))

            const profileMap = new Map<string, Profile>(
                (profiles || []).map((profile) => [profile.id, profile])
            )

            const enriched: ConversationWithUser[] = data.map((conversation) => {
                const otherUserId = conversation.participant_1 === user.id
                    ? conversation.participant_2
                    : conversation.participant_1
                const profile = profileMap.get(otherUserId)

                return {
                    ...conversation,
                    other_user: {
                        id: otherUserId,
                        email: profile?.email || 'user@campus.edu',
                        full_name: profile?.full_name || undefined,
                        avatar_url: profile?.avatar_url || undefined
                    }
                }
            })

            setConversations(enriched)

            const missingIds = Array.from(
                new Set(
                    enriched
                        .filter((conversation) => !conversation.other_user?.full_name || !conversation.other_user?.avatar_url)
                        .map((conversation) => conversation.other_user?.id)
                        .filter((id): id is string => Boolean(id))
                )
            )

            await Promise.all(missingIds.map(async (id) => {
                try {
                    const response = await fetch(`/api/users/${id}`)
                    if (!response.ok) return

                    const userData = await response.json() as {
                        email?: string
                        full_name?: string
                        avatar_url?: string
                    }

                    setConversations((prev) => prev.map((conversation) => {
                        if (conversation.other_user?.id !== id) return conversation

                        return {
                            ...conversation,
                            other_user: {
                                id,
                                email: userData.email || conversation.other_user.email,
                                full_name: userData.full_name || conversation.other_user.full_name,
                                avatar_url: userData.avatar_url || conversation.other_user.avatar_url
                            }
                        }
                    }))
                } catch (err) {
                    console.error(`Failed to fetch user ${id}`, err)
                }
            }))

            const paramId = searchParams.get('id')
            if (paramId && enriched.some((conversation) => conversation.id === paramId)) {
                setSelectedConvoId(paramId)
                setMobileShowChat(true)
            } else if (enriched.length > 0 && !mobileShowChat && window.innerWidth >= 768) {
                setSelectedConvoId(enriched[0].id)
            }

            setLoadingConvos(false)
        }

        void fetchConversations()

        const channel = supabase
            .channel('conversations')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `participant_1=eq.${user.id}`
            }, () => { void fetchConversations() })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `participant_2=eq.${user.id}`
            }, () => { void fetchConversations() })
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [user, isLoaded, supabase, mobileShowChat, searchParams])

    useEffect(() => {
        if (!selectedConvoId || !supabase) return

        const fetchMessages = async () => {
            setLoadingMessages(true)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', selectedConvoId)
                .order('created_at', { ascending: true })

            if (error || !data) {
                console.error('Error fetching messages:', error)
            } else {
                setMessages(data)
            }
            setLoadingMessages(false)
        }

        void fetchMessages()

        const channel = supabase
            .channel(`messages:${selectedConvoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${selectedConvoId}`
            }, (payload) => {
                const typedPayload = payload as unknown as ConversationPayload
                setMessages((prev) => [...prev, typedPayload.new])
            })
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [selectedConvoId, supabase])

    useEffect(() => {
        if (!selectedConvoId || !user || !supabase) return

        const markAsRead = async () => {
            await supabase
                .from('messages')
                .update({ status: 'read' })
                .eq('conversation_id', selectedConvoId)
                .neq('sender_id', user.id)
                .neq('status', 'read')
        }

        void markAsRead()
    }, [selectedConvoId, messages.length, supabase, user])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loadingMessages])

    const handleSend = async () => {
        if (!messageInput.trim() || !selectedConvoId || !user || !supabase) return

        const text = messageInput.trim()
        setMessageInput('')

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: selectedConvoId,
                sender_id: user.id,
                text,
                status: 'sent'
            })

        if (error) {
            console.error('Error sending message:', error)
            toast('Failed to send message', 'error')
            setMessageInput(text)
            return
        }

        await supabase
            .from('conversations')
            .update({
                last_message_text: text,
                last_message_at: new Date().toISOString()
            })
            .eq('id', selectedConvoId)
    }

    const filteredConversations = conversations.filter((conversation) =>
        conversation.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.last_message_text?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const selectedConvo = conversations.find((conversation) => conversation.id === selectedConvoId)

    if (!isLoaded || !supabase || loadingConvos) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-160px)]">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary)' }} />
            </div>
        )
    }

    return (
        <div className="rounded-lg shadow-md overflow-hidden flex h-[calc(100vh-160px)]"
            style={{ background: 'var(--bg-card)' }}>

            <div className={`w-full md:w-80 md:min-w-[320px] flex flex-col ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}
                style={{ borderRight: '1px solid var(--border-subtle)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Messages</h2>
                    </div>
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
                                swipeStateRef.current[convo.id] = {
                                    startX: e.touches[0].clientX,
                                    startY: e.touches[0].clientY
                                }
                            }

                            const handleSwipeMove = (e: React.TouchEvent<HTMLDivElement>) => {
                                const swipeState = swipeStateRef.current[convo.id]
                                if (!swipeState || swipeState.startX == null || swipeState.startY == null) return

                                const diffX = e.touches[0].clientX - swipeState.startX
                                const diffY = e.touches[0].clientY - swipeState.startY
                                if (Math.abs(diffX) <= Math.abs(diffY) || diffX >= 0) return

                                const clamped = Math.max(diffX, -80)
                                const inner = e.currentTarget.querySelector('[data-swipe-inner]') as HTMLElement | null
                                if (inner) {
                                    inner.style.transform = `translateX(${clamped}px)`
                                    inner.style.transition = 'none'
                                }
                            }

                            const handleSwipeEnd = (e: React.TouchEvent<HTMLDivElement>) => {
                                const swipeState = swipeStateRef.current[convo.id]
                                if (!swipeState || swipeState.startX == null) return

                                const diffX = e.changedTouches[0].clientX - swipeState.startX
                                const inner = e.currentTarget.querySelector('[data-swipe-inner]') as HTMLElement | null
                                if (inner) {
                                    inner.style.transition = 'transform 0.3s ease'
                                    inner.style.transform = diffX < -50 ? 'translateX(-72px)' : 'translateX(0px)'
                                }

                                swipeStateRef.current[convo.id] = { startX: null, startY: null }
                            }

                            return (
                                <div
                                    key={convo.id}
                                    className="relative overflow-hidden"
                                    onTouchStart={handleSwipeStart}
                                    onTouchMove={handleSwipeMove}
                                    onTouchEnd={handleSwipeEnd}
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-red-500 text-white text-xs font-semibold"
                                        onClick={() => {
                                            setConversations((prev) => prev.filter((conversation) => conversation.id !== convo.id))
                                            if (selectedConvoId === convo.id) {
                                                setSelectedConvoId(null)
                                                setMobileShowChat(false)
                                            }
                                        }}
                                    >
                                        Archive
                                    </div>

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

            <div className={`flex-1 flex flex-col ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
                {selectedConvo ? (
                    <>
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
                                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.sender_id === user?.id ? 'text-white rounded-br-md' : 'rounded-bl-md'}`}
                                                style={{
                                                    background: msg.sender_id === user?.id ? 'var(--brand-primary)' : 'var(--bg-card)',
                                                    color: msg.sender_id === user?.id ? '#ffffff' : 'var(--text-primary)',
                                                    border: msg.sender_id === user?.id ? 'none' : '1px solid var(--border-subtle)'
                                                }}
                                            >
                                                {msg.text}
                                            </div>
                                            <div className={`flex items-center gap-1 mt-1 text-[10px] ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                                style={{ color: 'var(--text-muted)' }}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                {msg.sender_id === user?.id && <StatusIcon status={msg.status} />}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 border-t" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2"
                                    style={{
                                        background: 'var(--bg-lighter)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <button
                                    onClick={() => { void handleSend() }}
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
