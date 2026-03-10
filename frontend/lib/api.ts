const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; csrf_token=`)
  if (parts.length === 2) {
    return parts.pop()!.split(';').shift() || null
  }
  return null
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const url = input.startsWith('http')
    ? input
    : `${API_BASE_URL}${input.startsWith('/') ? '' : '/'}${input}`

  const csrfToken = getCsrfTokenFromCookie()

  const headers = new Headers(init.headers || {})

  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (csrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrfToken)
  }

  return fetch(url, {
    ...init,
    headers,
  })
}

