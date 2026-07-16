const accessTokenKey = 'meu-baba-access-token'

export function getAccessToken() {
  return window.localStorage.getItem(accessTokenKey)
}

export function setAccessToken(accessToken: string) {
  window.localStorage.setItem(accessTokenKey, accessToken)
}

export function clearAccessToken() {
  window.localStorage.removeItem(accessTokenKey)
}

