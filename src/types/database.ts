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
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    avatar_url: string | null
                    bio: string | null
                    major: string | null
                    year: string | null
                    updated_at: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    major?: string | null
                    year?: string | null
                    updated_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    major?: string | null
                    year?: string | null
                    updated_at?: string | null
                }
            }
            conversations: {
                Row: {
                    id: string
                    participant_1: string
                    participant_2: string
                    last_message_text: string | null
                    last_message_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    participant_1: string
                    participant_2: string
                    last_message_text?: string | null
                    last_message_at?: string
                    created_at?: string
                }
                Update: {
                    last_message_text?: string | null
                    last_message_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    text: string
                    status: 'sent' | 'delivered' | 'read'
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    text: string
                    status?: 'sent' | 'delivered' | 'read'
                    created_at?: string
                }
                Update: {
                    status?: 'sent' | 'delivered' | 'read'
                }
            }
            posts: {
                Row: {
                    id: string
                    user_id: string
                    username: string | null
                    campus: string | null
                    title: string
                    body: string | null
                    flair: string | null
                    upvotes: number
                    downvotes: number
                    comment_count: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    username?: string | null
                    campus?: string | null
                    title: string
                    body?: string | null
                    flair?: string | null
                    upvotes?: number
                    downvotes?: number
                    comment_count?: number
                    created_at?: string
                }
                Update: {
                    title?: string
                    body?: string | null
                    flair?: string | null
                    upvotes?: number
                    downvotes?: number
                    comment_count?: number
                }
            }
            post_votes: {
                Row: {
                    id: string
                    post_id: string
                    user_id: string
                    vote: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    post_id: string
                    user_id: string
                    vote: number
                    created_at?: string
                }
                Update: {
                    vote?: number
                }
            }
            comments: {
                Row: {
                    id: string
                    post_id: string
                    parent_id: string | null
                    user_id: string
                    username: string | null
                    body: string
                    upvotes: number
                    downvotes: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    post_id: string
                    parent_id?: string | null
                    user_id: string
                    username?: string | null
                    body: string
                    upvotes?: number
                    downvotes?: number
                    created_at?: string
                }
                Update: {
                    body?: string
                    upvotes?: number
                    downvotes?: number
                }
            }
            comment_votes: {
                Row: {
                    id: string
                    comment_id: string
                    user_id: string
                    vote: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    comment_id: string
                    user_id: string
                    vote: number
                    created_at?: string
                }
                Update: {
                    vote?: number
                }
            }
        }
    }
}

// Listing types
export type Listing = Database['public']['Tables']['listings']['Row']
export type ListingInsert = Database['public']['Tables']['listings']['Insert']
export type ListingUpdate = Database['public']['Tables']['listings']['Update']

export type ListingImage = Database['public']['Tables']['listing_images']['Row']
export type ListingImageInsert = Database['public']['Tables']['listing_images']['Insert']

// Profile types
export type Profile = Database['public']['Tables']['profiles']['Row']

// Messaging types
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

// Community types
export type Post = Database['public']['Tables']['posts']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

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
