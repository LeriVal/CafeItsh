import { useEffect, useState } from 'react'
import { ApiError } from '../../lib/api'
import { fetchMenu } from '../../lib/menu'
import type { MenuDia } from '../../lib/menu'

function formatoPrecio(precio: string): string {
  const n = Number(precio)
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : `$${precio}`
}

export default function Menu() {
  const [menu, setMenu] = useState<MenuDia | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchMenu()
      .then(setMenu)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo conectar'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <p className="text-ink-soft">Cargando menú…</p>

  if (error) {
    return (
      <p role="alert" className="input-error">
        {error}
      </p>
    )
  }

  if (!menu || menu.lineas.length === 0) {
    return (
      <section className="card">
        <h1 className="font-display text-xl font-bold">Menú del día</h1>
        <p className="mt-2 text-ink-soft">
          Aún no hay menú publicado para hoy. Vuelve más tarde.
        </p>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold">Menú del día</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {menu.lineas.map((l) => (
          <article
            key={l.id}
            className={`card flex flex-col gap-2 ${l.disponible ? '' : 'opacity-70'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-lg font-bold">{l.platillo.nombre}</h2>
              {l.especial && (
                <span className="rounded-full bg-espresso px-3 py-1 text-xs font-bold text-white">
                  Especial del día
                </span>
              )}
            </div>
            {l.platillo.descripcion && (
              <p className="text-sm text-ink-soft">{l.platillo.descripcion}</p>
            )}
            <div className="mt-auto flex items-center justify-between pt-2">
              <strong className="font-display text-xl font-bold">
                {formatoPrecio(l.precio)}
              </strong>
              {l.disponible ? (
                <span className="text-sm font-bold text-primary">Disponible</span>
              ) : (
                <span className="rounded-full bg-outline-soft px-3 py-1 text-xs font-bold text-ink-soft">
                  No disponible
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
