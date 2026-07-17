import { createContext, useContext } from 'react'
import type { AuthUser } from './authApi'

export type AuthContextValue = {
  user: AuthUser | null
  isSessionLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  setSession: (accessToken: string, user: AuthUser) => void
  clearSession: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
