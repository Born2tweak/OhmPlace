'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, MoreHorizontal, Send, Smile, Paperclip, ArrowLeft, Check, CheckCheck, ShieldBan, Flag, Trash2, X } from 'lucide-react'

type MessageStatus = 'sent' | 'delivered' | 'read'

interface Message {
    id: string
    text: string
    sender: 'me' | 'them'
    timestamp: string
    status?: MessageStatus
}

interface Conversation {
    id: string
    name: string
    avatar: string
    lastMessage: string
    timestamp: string
    unread: boolean
    online: boolean
    blocked: boolean
    messages: Message[]
}

const initialConversations: Conversation[] = [
    {
        id: '1',
        name: 'Sarah Chen',
        avatar: 'SC',
        lastMessage: 'Is the textbook still available?',
        timestamp: '2m',
        unread: true,
        online: true,
        blocked: false,
        messages: [
            { id: '1', text: 'Hey! I saw your listing for the Calc textbook', sender: 'them', timestamp: '10:30 AM' },
            { id: '2', text: 'Is it still available?', sender: 'them', timestamp: '10:30 AM' },
            { id: '3', text: 'Yes it is! Are you interested?', sender: 'me', timestamp: '10:32 AM', status: 'read' },
            { id: '4', text: 'Definitely! What condition is it in?', sender: 'them', timestamp: '10:33 AM' },
            { id: '5', text: 'Great condition, barely used. No highlights or writing', sender: 'me', timestamp: '10:35 AM', status: 'read' },
            { id: '6', text: 'Is the textbook still available?', sender: 'them', timestamp: '10:36 AM' },
        ]
    },
    {
        id: '2',
        name: 'Marcus Johnson',
        avatar: 'MJ',
        lastMessage: 'Can you do $40 for the lamp?',
        timestamp: '15m',
        unread: true,
        online: false,
        blocked: false,
        messages: [
            { id: '1', text: 'Hi, I\'m interested in the desk lamp', sender: 'them', timestamp: '9:00 AM' },
            { id: '2', text: 'Sure! It\'s $50', sender: 'me', timestamp: '9:05 AM', status: 'delivered' },
            { id: '3', text: 'Can you do $40 for the lamp?', sender: 'them', timestamp: '9:10 AM' },
        ]
    },
    {
        id: '3',
        name: 'Priya Patel',
        avatar: 'PP',
        lastMessage: 'Thanks, see you tomorrow!',
        timestamp: '1h',
        unread: false,
        online: true,
        blocked: false,
        messages: [
            { id: '1', text: 'Hey, when can I pick up the monitor?', sender: 'them', timestamp: '8:00 AM' },
            { id: '2', text: 'I\'m free tomorrow afternoon', sender: 'me', timestamp: '8:10 AM', status: 'read' },
            { id: '3', text: 'Thanks, see you tomorrow!', sender: 'them', timestamp: '8:12 AM' },
        ]
    },
    {
        id: '4',
        name: 'Jake Williams',
        avatar: 'JW',
        lastMessage: 'Sounds good, let me know',
        timestamp: '3h',
        unread: false,
        online: false,
        blocked: false,
        messages: [
            { id: '1', text: 'Do you still have the Arduino kit?', sender: 'them', timestamp: 'Yesterday' },
            { id: '2', text: 'Yes! Want to meet at the engineering building?', sender: 'me', timestamp: 'Yesterday', status: 'delivered' },
            { id: '3', text: 'Sounds good, let me know', sender: 'them', timestamp: 'Yesterday' },
        ]
    },
    {
        id: '5',
        name: 'Emily Rodriguez',
        avatar: 'ER',
        lastMessage: 'I\'ll take it!',
        timestamp: '1d',
        unread: false,
        online: false,
        blocked: false,
        messages: [
            { id: '1', text: 'Is the mini fridge available?', sender: 'them', timestamp: 'Monday' },
            { id: '2', text: 'Yes, pickup anytime this week', sender: 'me', timestamp: 'Monday', status: 'read' },
            { id: '3', text: 'I\'ll take it!', sender: 'them', timestamp: 'Monday' },
        ]
    },
]

function StatusIcon({ status }: { status?: MessageStatus }) {
    if (!status) return null
    if (status === 'sent') return <Check className="w-3.5 h-3.5 text-[#5a6c7d]" />
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-[#5a6c7d]" />
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-[#22c1c3]" />
    return null
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
    const [selectedConvoId, setSelectedConvoId] = useState<string>('1')
    const [messageInput, setMessageInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileShowChat, setMobileShowChat] = useState(false)
    const [showHeaderMenu, setShowHeaderMenu] = useState(false)
    const [showBlockConfirm, setShowBlockConfirm] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const selectedConvo = conversations.find(c => c.id === selectedConvoId)!

    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [selectedConvo.messages])

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowHeaderMenu(false)
            }
        }
        if (showHeaderMenu) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showHeaderMenu])

    const getCurrentTime = () => {
        const now = new Date()
        return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const handleSend = () => {
        if (!messageInput.trim() || selectedConvo.blocked) return

        const newMessage: Message = {
            id: Date.now().toString(),
            text: messageInput.trim(),
            sender: 'me',
            timestamp: getCurrentTime(),
            status: 'sent',
        }

        setConversations(prev => prev.map(c => {
            if (c.id !== selectedConvoId) return c
            return {
                ...c,
                messages: [...c.messages, newMessage],
                lastMessage: newMessage.text,
                timestamp: 'now',
            }
        }))

        setMessageInput('')

        // Simulate delivered after 1s
        setTimeout(() => {
            setConversations(prev => prev.map(c => {
                if (c.id !== selectedConvoId) return c
                return {
                    ...c,
                    messages: c.messages.map(m =>
                        m.id === newMessage.id ? { ...m, status: 'delivered' as MessageStatus } : m
                    )
                }
            }))
        }, 1000)

        // Simulate read after 3s if user is online
        if (selectedConvo.online) {
            setTimeout(() => {
                setConversations(prev => prev.map(c => {
                    if (c.id !== selectedConvoId) return c
                    return {
                        ...c,
                        messages: c.messages.map(m =>
                            m.id === newMessage.id ? { ...m, status: 'read' as MessageStatus } : m
                        )
                    }
                }))
            }, 3000)
        }
    }

    const handleSelectConvo = (convo: Conversation) => {
        setSelectedConvoId(convo.id)
        setMobileShowChat(true)
        setShowHeaderMenu(false)
        // Mark as read when selecting
        setConversations(prev => prev.map(c =>
            c.id === convo.id ? { ...c, unread: false } : c
        ))
    }

    const handleToggleBlock = () => {
        setShowBlockConfirm(true)
        setShowHeaderMenu(false)
    }

    const confirmBlock = () => {
        setConversations(prev => prev.map(c =>
            c.id === selectedConvoId ? { ...c, blocked: !c.blocked } : c
        ))
        setShowBlockConfirm(false)
    }

    const handleDeleteConversation = () => {
        setConversations(prev => {
            const updated = prev.filter(c => c.id !== selectedConvoId)
            if (updated.length > 0) {
                setSelectedConvoId(updated[0].id)
            }
            return updated
        })
        setShowHeaderMenu(false)
        setMobileShowChat(false)
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex" style={{ height: 'calc(100vh - 160px)' }}>
            {/* Conversation List - Left Panel */}
            <div className={`w-full md:w-80 md:min-w-[320px] border-r border-gray-200 flex flex-col ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-[#2c3e50]">Messages</h2>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6c7d]" />
                        <input
                            type="text"
                            placeholder="Search messages"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#f4fafb] border border-[#d4e8ea] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#22c1c3]/30 focus:border-[#22c1c3] text-[#2c3e50] placeholder-[#5a6c7d]"
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map((convo) => (
                        <button
                            key={convo.id}
                            onClick={() => handleSelectConvo(convo)}
                            className={`w-full flex items-start gap-3 p-4 hover:bg-[#f4fafb] transition-colors text-left ${
                                selectedConvoId === convo.id ? 'bg-[#f4fafb] border-l-2 border-l-[#22c1c3]' : ''
                            }`}
                        >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                                    convo.blocked ? 'bg-gray-400' : 'bg-[#22c1c3]'
                                }`}>
                                    {convo.avatar}
                                </div>
                                {convo.online && !convo.blocked && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                                )}
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${convo.unread ? 'font-bold text-[#2c3e50]' : 'font-medium text-[#2c3e50]'}`}>
                                        {convo.name}
                                        {convo.blocked && <span className="text-xs text-red-400 ml-1.5">Blocked</span>}
                                    </span>
                                    <span className="text-xs text-[#5a6c7d] flex-shrink-0">{convo.timestamp}</span>
                                </div>
                                <p className={`text-sm truncate mt-0.5 ${convo.unread ? 'text-[#2c3e50] font-medium' : 'text-[#5a6c7d]'}`}>
                                    {convo.lastMessage}
                                </p>
                            </div>
                            {/* Unread indicator */}
                            {convo.unread && (
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-2.5 h-2.5 bg-[#22c1c3] rounded-full" />
                                </div>
                            )}
                        </button>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="p-8 text-center text-[#5a6c7d] text-sm">
                            No conversations found
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area - Right Panel */}
            <div className={`flex-1 flex flex-col ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                    <button
                        onClick={() => setMobileShowChat(false)}
                        className="md:hidden text-[#5a6c7d] hover:text-[#2c3e50]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                            selectedConvo.blocked ? 'bg-gray-400' : 'bg-[#22c1c3]'
                        }`}>
                            {selectedConvo.avatar}
                        </div>
                        {selectedConvo.online && !selectedConvo.blocked && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-[#2c3e50]">{selectedConvo.name}</h3>
                        <span className="text-xs text-[#5a6c7d]">
                            {selectedConvo.blocked ? 'Blocked' : selectedConvo.online ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    {/* Header Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                            className="text-[#5a6c7d] hover:text-[#2c3e50] transition-colors p-1 rounded-lg hover:bg-gray-100"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {showHeaderMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <button
                                    onClick={handleToggleBlock}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors text-[#2c3e50]"
                                >
                                    <ShieldBan className="w-4 h-4" />
                                    {selectedConvo.blocked ? 'Unblock User' : 'Block User'}
                                </button>
                                <button
                                    onClick={() => setShowHeaderMenu(false)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors text-[#2c3e50]"
                                >
                                    <Flag className="w-4 h-4" />
                                    Report User
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                <button
                                    onClick={handleDeleteConversation}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-red-50 transition-colors text-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Conversation
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Blocked banner */}
                {selectedConvo.blocked && (
                    <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-center justify-between">
                        <span className="text-sm text-red-600">You have blocked this user. They cannot send you messages.</span>
                        <button
                            onClick={() => {
                                setConversations(prev => prev.map(c =>
                                    c.id === selectedConvoId ? { ...c, blocked: false } : c
                                ))
                            }}
                            className="text-xs font-medium text-red-600 hover:text-red-700 underline"
                        >
                            Unblock
                        </button>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafbfc]">
                    {selectedConvo.messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className="max-w-[70%]">
                                <div
                                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                        msg.sender === 'me'
                                            ? 'bg-[#22c1c3] text-white rounded-br-md'
                                            : 'bg-white text-[#2c3e50] border border-gray-200 rounded-bl-md'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 ${
                                    msg.sender === 'me' ? 'justify-end' : 'justify-start'
                                }`}>
                                    <span className="text-[11px] text-[#5a6c7d]">
                                        {msg.timestamp}
                                    </span>
                                    {msg.sender === 'me' && <StatusIcon status={msg.status} />}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200 bg-white">
                    {selectedConvo.blocked ? (
                        <div className="text-center text-sm text-[#5a6c7d] py-2">
                            You can&apos;t send messages to a blocked user.
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button className="text-[#5a6c7d] hover:text-[#22c1c3] transition-colors p-1">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="w-full px-4 py-2.5 bg-[#f4fafb] border border-[#d4e8ea] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#22c1c3]/30 focus:border-[#22c1c3] text-[#2c3e50] placeholder-[#5a6c7d]"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6c7d] hover:text-[#22c1c3] transition-colors">
                                    <Smile className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                onClick={handleSend}
                                className={`p-2.5 rounded-full transition-colors ${
                                    messageInput.trim()
                                        ? 'bg-[#22c1c3] text-white hover:bg-[#1ba8aa]'
                                        : 'bg-gray-100 text-[#5a6c7d]'
                                }`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Block Confirmation Modal */}
            {showBlockConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-[#2c3e50]">
                                {selectedConvo.blocked ? 'Unblock' : 'Block'} {selectedConvo.name}?
                            </h3>
                            <button onClick={() => setShowBlockConfirm(false)} className="text-[#5a6c7d] hover:text-[#2c3e50]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-[#5a6c7d] mb-6">
                            {selectedConvo.blocked
                                ? `${selectedConvo.name} will be able to send you messages again.`
                                : `${selectedConvo.name} won't be able to send you messages and won't know they've been blocked.`
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBlockConfirm(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-[#2c3e50] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBlock}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${
                                    selectedConvo.blocked
                                        ? 'bg-[#22c1c3] hover:bg-[#1ba8aa]'
                                        : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                {selectedConvo.blocked ? 'Unblock' : 'Block'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
