import { createContext, useContext } from 'react'

type AvatarContextValue = {
    profileAvatar: string | null
    setProfileAvatar: (url: string | null) => void
}

export const AvatarContext = createContext<AvatarContextValue>({
    profileAvatar: null,
    setProfileAvatar: () => undefined,
})

export function useAvatar(): AvatarContextValue {
    return useContext(AvatarContext)
}
