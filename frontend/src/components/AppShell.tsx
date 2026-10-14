import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import Drawer, { drawerLinksFor } from './Drawer'

const TITULOS: Record<string, string> = {
  administrador: 'Administración',
  cajero: 'Caja',
  cocinero: 'Cocina',
  usuario: 'Cafetería ITSH',
}

export default function AppShell({
  children,
  barra,
}: {
  children: ReactNode
  barra?: ReactNode
}) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)

  function salir() {
    logout()
    setAbierto(false)
    navigate('/login', { replace: true })
  }

  const rol = usuario?.rol ?? 'usuario'
  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-30 border-b border-outline-soft bg-card md:hidden">
        <div className="flex items-center gap-3 p-4">
          <button
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-xl"
            type="button"
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <strong className="font-display">{TITULOS[rol] ?? 'Cafetería ITSH'}</strong>
        </div>
      </header>
      <Drawer
        open={abierto}
        onClose={() => setAbierto(false)}
        links={drawerLinksFor(rol)}
        userName={usuario?.nombre ?? ''}
        userRol={rol}
        onLogout={salir}
      />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-5xl p-4 pb-24 md:pb-4">{children}</main>
      </div>
      {barra}
    </div>
  )
}
