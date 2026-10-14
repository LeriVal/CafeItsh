import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api } from '../../lib/api'

interface Resumen {
  usuarios: number
  platillos: number
  lineas: Array<{ id: number; precio: string; disponible: boolean; especial: boolean; platillo: { nombre: string } }>
}

export default function Inicio() {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api<{ usuarios: Array<{ activo: boolean }> }>('/api/usuarios'),
      api<{ platillos: Array<unknown> }>('/api/platillos'),
      api<{ lineas: Resumen['lineas'] }>('/api/menu'),
    ])
      .then(([u, p, m]) => {
        setResumen({
          usuarios: u.usuarios.filter((x) => x.activo).length,
          platillos: p.platillos.length,
          lineas: m.lineas,
        })
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo conectar'))
  }, [])

  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-bold">Administración</h1>
        <p className="text-sm text-ink-soft">{hoy}</p>
      </div>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/admin/usuarios" className="card">
          <p className="font-display text-2xl font-bold">{resumen?.usuarios ?? '—'}</p>
          <p className="font-bold text-primary">Usuarios activos</p>
        </Link>
        <Link to="/admin/platillos" className="card">
          <p className="font-display text-2xl font-bold">{resumen?.platillos ?? '—'}</p>
          <p className="font-bold text-primary">Platillos en catálogo</p>
        </Link>
        <Link to="/admin/menu" className="card">
          <p className="font-display text-2xl font-bold">{resumen?.lineas.length ?? '—'}</p>
          <p className="font-bold text-primary">Publicados hoy</p>
        </Link>
      </div>

      <section className="card">
        <h2 className="font-bold">Menú de hoy</h2>
        {!resumen ? (
          <p className="mt-2 text-sm text-ink-soft">Cargando…</p>
        ) : resumen.lineas.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            No hay menú publicado. <Link className="font-bold text-primary" to="/admin/menu">Armar menú</Link>
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {resumen.lineas.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                <span className={l.disponible ? '' : 'text-ink-soft line-through'}>
                  {l.platillo.nombre}
                </span>
                <span className="flex items-center gap-2">
                  {l.especial && (
                    <span className="rounded-full bg-espresso px-2 py-0.5 text-xs font-bold text-white">
                      Especial
                    </span>
                  )}
                  {!l.disponible && (
                    <span className="rounded-full bg-outline-soft px-2 py-0.5 text-xs font-bold text-ink-soft">
                      No disponible
                    </span>
                  )}
                  <strong>${Number(l.precio).toFixed(2)}</strong>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
