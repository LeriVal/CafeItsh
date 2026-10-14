import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { SONDEO_MS, listosCaja } from '../lib/operacion'
import { misAvisos } from '../lib/seguimiento'

function useContador(origen: 'cliente' | 'caja'): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    let vivo = true
    async function contar() {
      try {
        const c =
          origen === 'cliente'
            ? (await misAvisos()).avisos.filter((a) => !a.leida).length
            : (await listosCaja()).pedidos.length
        if (vivo) setN(c)
      } catch {
        /* sin conexión: se conserva el último valor */
      }
    }
    void contar()
    const id = setInterval(() => void contar(), SONDEO_MS)
    return () => {
      vivo = false
      clearInterval(id)
    }
  }, [origen])
  return n
}

export function BottomBarCliente() {
  const pendientes = useContador('cliente')
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid min-h-[56px] grid-cols-2 border-t border-outline-soft bg-card md:hidden"
      aria-label="Navegación principal"
    >
      <NavLink
        to="/menu"
        className={({ isActive }) =>
          `flex min-h-[56px] items-center justify-center font-bold ${isActive ? 'text-primary' : 'text-ink-soft'}`
        }
      >
        Menú
      </NavLink>
      <NavLink
        to="/mis-pedidos"
        className={({ isActive }) =>
          `flex min-h-[56px] items-center justify-center gap-2 font-bold ${isActive ? 'text-primary' : 'text-ink-soft'}`
        }
      >
        Mis pedidos
        {pendientes > 0 && (
          <span className="rounded-full bg-error px-2 py-0.5 text-xs font-bold text-white" aria-label={`${pendientes} listos para recoger`}>
            {pendientes}
          </span>
        )}
      </NavLink>
    </nav>
  )
}

export function BottomBarCaja() {
  const pendientes = useContador('caja')
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid min-h-[56px] grid-cols-2 border-t border-outline-soft bg-card md:hidden"
      aria-label="Navegación de caja"
    >
      <NavLink
        to="/caja"
        end
        className={({ isActive }) =>
          `flex min-h-[56px] items-center justify-center font-bold ${isActive ? 'text-primary' : 'text-ink-soft'}`
        }
      >
        Caja
      </NavLink>
      <NavLink
        to="/caja/entregas"
        className={({ isActive }) =>
          `flex min-h-[56px] items-center justify-center gap-2 font-bold ${isActive ? 'text-primary' : 'text-ink-soft'}`
        }
      >
        Entregas
        {pendientes > 0 && (
          <span className="rounded-full bg-error px-2 py-0.5 text-xs font-bold text-white" aria-label={`${pendientes} por entregar`}>
            {pendientes}
          </span>
        )}
      </NavLink>
    </nav>
  )
}
