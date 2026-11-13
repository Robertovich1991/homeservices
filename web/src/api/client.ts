export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export type ApiErrorCode = 'network' | 'http' | 'server'

export class ApiError extends Error {
  code: ApiErrorCode
  status: number
  url: string

  constructor(message: string, code: ApiErrorCode, status = 0) {
    super(message)
    this.code = code
    this.status = status
    this.url = API_BASE_URL
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | undefined | null>
}

let authToken: string | null = null
let handleUnauthorized: (() => void) | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
}

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  handleUnauthorized = handler
}

const buildQuery = (query: RequestOptions['query']) => {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value)
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, query } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('network', 'network')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && authToken && handleUnauthorized) handleUnauthorized()
    const message = typeof data?.message === 'string' ? data.message : ''
    throw new ApiError(message || 'http', message ? 'server' : 'http', response.status)
  }

  return data as T
}
