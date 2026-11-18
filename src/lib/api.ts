export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'same-origin',
  })

  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  let payload: unknown
  if (isJson) {
    try {
      payload = await response.json()
    } catch {
      throw new ApiError('The ChessDesk API returned unreadable JSON. Check that the frontend and backend were deployed together.', 502)
    }
  } else {
    payload = await response.text()
    if (response.ok) {
      throw new ApiError('The ChessDesk API returned a web page instead of JSON data. Deploy ChessDesk as a Node Web Service with npm start, not as a static frontend.', 502)
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'error' in payload
      ? String(payload.error)
      : 'Something went wrong. Please try again.'
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('chessdesk:unauthorized'))
    }
    throw new ApiError(message, response.status)
  }

  return payload as T
}
