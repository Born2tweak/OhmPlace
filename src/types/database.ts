export type Database = {
    public: {
        Tables: {
            listings: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    description: string | null
                    category: string
                    condition: 'new' | 'used-good' | 'used-fair'
                    price: number
                    status: 'available' | 'sold' | 'reserved'
                    promoted: boolean
                    promoted_until: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    description?: string | null
                    category: string
                    condition: 'new' | 'used-good' | 'used-fair'
                    price: number
                    status?: 'available' | 'sold' | 'reserved'
                    promoted?: boolean
                    promoted_until?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    category?: string
                    condition?: 'new' | 'used-good' | 'used-fair'
                    price?: number
                    status?: 'available' | 'sold' | 'reserved'
                    promoted?: boolean
                    promoted_until?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            listing_images: {
                Row: {
                    id: string
                    listing_id: string
                    image_url: string
                    order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    listing_id: string
                    image_url: string
                    order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    listing_id?: string
                    image_url?: string
                    order?: number
                    created_at?: string
                }
            }
        }
    }
}

export type Listing = Database['public']['Tables']['listings']['Row']
export type ListingInsert = Database['public']['Tables']['listings']['Insert']
export type ListingUpdate = Database['public']['Tables']['listings']['Update']

export type ListingImage = Database['public']['Tables']['listing_images']['Row']
export type ListingImageInsert = Database['public']['Tables']['listing_images']['Insert']

// Messaging types
export interface Conversation {
    id: string
    participant_1: string
    participant_2: string
    last_message_text: string | null
    last_message_at: string
    created_at: string
}

export interface Message {
    id: string
    conversation_id: string
    sender_id: string
    text: string
    status: 'sent' | 'delivered' | 'read'
    created_at: string
}

export interface BlockedUser {
    id: string
    blocker_id: string
    blocked_id: string
    created_at: string
}

export const CATEGORIES = [
    'Resistors',
    'Capacitors',
    'Sensors',
    'Microcontrollers',
    'Motors',
    'LEDs',
    'ICs',
    'Power Supplies',
    'Cables & Connectors',
    'Development Boards',
    'Other'
] as const

export const CONDITIONS = [
    { value: 'new', label: 'New' },
    { value: 'used-good', label: 'Used - Good Condition' },
    { value: 'used-fair', label: 'Used - Fair Condition' }
] as const
