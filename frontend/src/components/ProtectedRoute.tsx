import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import type { Rol } from '../lib/auth'

export default function ProtectedRoute({
  allowed,
  children,
}: {
  allowed: Rol[]
  children: ReactNode
}) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <p className="text-ink-soft">Cargando…</p>
      </main>
    )
  }
  if (!usuario) {
    return <Navigate to="/login" replace />
  }
  if (!allowed.includes(usuario.rol)) {
    return <Navigate to="/sin-acceso" replace />
  }
  return <>{children}</>
}
