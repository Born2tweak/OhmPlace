import { createContext, useContext } from 'react'

export const CampusContext = createContext<string | null>(null)

export function useCampus(): string | null {
    return useContext(CampusContext)
}
