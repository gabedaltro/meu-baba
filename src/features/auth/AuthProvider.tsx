import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchAuthenticatedUser,
  type AuthUser,
} from './authApi'
import { AuthContext } from './authContext'
import {
  clearAccessToken,
  getAccessToken,
  getAuthUser,
  setAuthSession,
} from './authStorage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser())
  const [isSessionLoading, setIsSessionLoading] = useState(() =>
    Boolean(getAccessToken()),
  )

  const clearSession = useCallback(() => {
    clearAccessToken()
    setUser(null)
  }, [])

  const setSession = useCallback((accessToken: string, nextUser: AuthUser) => {
    setAuthSession(accessToken, nextUser)
    setUser(nextUser)
  }, [])

  useEffect(() => {
    let isMounted = true
    const accessToken = getAccessToken()

    if (!accessToken) {
      return () => {
        isMounted = false
      }
    }

    fetchAuthenticatedUser()
      .then((authenticatedUser) => {
        if (isMounted) {
          setAuthSession(accessToken, authenticatedUser)
          setUser(authenticatedUser)
        }
      })
      .catch(() => {
        if (isMounted) {
          clearSession()
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSessionLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [clearSession])

  const value = useMemo(
    () => ({
      user,
      isSessionLoading,
      isAuthenticated: Boolean(getAccessToken() && user),
      isAdmin: user?.role === 'ADMIN',
      setSession,
      clearSession,
    }),
    [clearSession, isSessionLoading, setSession, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
