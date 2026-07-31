import type { AuthUser } from './authApi'

const accessTokenKey = 'meu-baba-access-token'
const authUserKey = 'meu-baba-auth-user'

export function getAccessToken() {
  return window.localStorage.getItem(accessTokenKey)
}

export function setAccessToken(accessToken: string) {
  window.localStorage.setItem(accessTokenKey, accessToken)
}

export function getAuthUser() {
  const storedUser = window.localStorage.getItem(authUserKey)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    return null
  }
}

export function setAuthUser(user: AuthUser) {
  window.localStorage.setItem(authUserKey, JSON.stringify(user))
}

export function setAuthSession(accessToken: string, user: AuthUser) {
  setAccessToken(accessToken)
  setAuthUser(user)
}

export function clearAccessToken() {
  window.localStorage.removeItem(accessTokenKey)
  window.localStorage.removeItem(authUserKey)
}
