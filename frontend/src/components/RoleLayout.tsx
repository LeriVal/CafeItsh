import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'

const TITULOS: Record<string, string> = {
  administrador: 'Administración',
  cajero: 'Caja',
  cocinero: 'Cocina',
  usuario: 'Cafetería ITSH',
}

export default function RoleLayout({ children }: { children: ReactNode }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function salir() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-outline-soft bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <strong className="font-display">
            {usuario ? TITULOS[usuario.rol] : 'Cafetería ITSH'}
          </strong>
          <div className="flex items-center gap-3">
            {usuario && <span className="text-sm text-ink-soft">{usuario.nombre}</span>}
            <button className="btn-secondary min-h-[44px]" type="button" onClick={salir}>
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  )
}
