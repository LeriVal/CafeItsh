import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, getToken } from './api'

export type Rol = 'administrador' | 'cajero' | 'cocinero' | 'usuario'

export interface Usuario {
  id: number
  nombre: string
  correo: string
  rol: Rol
}

export const ROL_HOME: Record<Rol, string> = {
  administrador: '/admin',
  cajero: '/caja',
  cocinero: '/cocina',
  usuario: '/menu',
}

interface AuthState {
  usuario: Usuario | null
  loading: boolean
  login: (correo: string, password: string) => Promise<Usuario>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api<{ usuario: Usuario }>('/api/auth/me')
      .then(({ usuario }) => setUsuario(usuario))
      .catch(() => localStorage.removeItem('itsh.token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (correo: string, password: string) => {
    const data = await api<{ token: string; usuario: Usuario }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    })
    localStorage.setItem('itsh.token', data.token)
    setUsuario(data.usuario)
    return data.usuario
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('itsh.token')
    setUsuario(null)
  }, [])

  const value = useMemo(() => ({ usuario, loading, login, logout }), [usuario, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requiere <AuthProvider>')
  return ctx
}
