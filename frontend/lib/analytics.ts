// Lightweight analytics tracking client

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function trackImpression(pinId: string, boardId: string, sessionId?: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/impressions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pin_id: pinId,
        board_id: boardId,
        session_id: sessionId,
      }),
    })

    if (!response.ok) {
      console.error('Failed to track impression')
    }
  } catch (error) {
    // Silent fail for analytics
    console.error('Analytics error:', error)
  }
}

export async function trackClick(
  pinId: string,
  boardId: string,
  clickType: 'pin' | 'contact' | 'website' | 'map' | 'share' = 'pin',
  sessionId?: string
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/clicks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pin_id: pinId,
        board_id: boardId,
        click_type: clickType,
        session_id: sessionId,
      }),
    })

    if (!response.ok) {
      console.error('Failed to track click')
    }
  } catch (error) {
    // Silent fail for analytics
    console.error('Analytics error:', error)
  }
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('session_id', sessionId)
  }
  return sessionId
}

