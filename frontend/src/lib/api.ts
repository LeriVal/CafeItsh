/** Cliente HTTP mínimo con envelope de errores del backend. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function getToken(): string | null {
  return localStorage.getItem('itsh.token')
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (res.status === 204) return null as T
  const body = (await res.json().catch(() => null)) as {
    error?: { code: string; message: string }
  } | null
  if (!res.ok) {
    const err = body?.error ?? { code: 'NETWORK_ERROR', message: 'No se pudo conectar' }
    throw new ApiError(res.status, err.code, err.message)
  }
  return body as T
}
