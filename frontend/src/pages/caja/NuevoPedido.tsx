import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api } from '../../lib/api'
import { useCaptura } from './CapturaContext'

interface LineaMenu {
  id: number
  precio: string
  disponible: boolean
  especial: boolean
  platillo: { nombre: string; categoria: string | null; descripcion: string | null }
}

export default function NuevoPedido() {
  const [lineas, setLineas] = useState<LineaMenu[]>([])
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [cant, setCant] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const { items, total, conteo, agregar, fijarCantidad } = useCaptura()

  useEffect(() => {
    api<{ lineas: LineaMenu[] }>('/api/menu')
      .then(({ lineas }) => {
        setLineas(lineas.filter((l) => l.disponible))
        setError(null)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo conectar'))
      .finally(() => setCargando(false))
  }, [])

  const categorias = useMemo(() => {
    const set = new Set<string>()
    for (const l of lineas) {
      if (l.platillo.categoria) set.add(l.platillo.categoria)
    }
    return [...set]
  }, [lineas])

  const visibles = lineas.filter(
    (l) =>
      (categoria === '' || l.platillo.categoria === categoria) &&
      l.platillo.nombre.toLowerCase().includes(texto.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold">Nuevo pedido</h1>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <input
          className="input-field"
          placeholder="Buscar producto..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Buscar producto"
        />
        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
            <button
              className={`min-h-[44px] rounded-full px-4 text-sm font-bold ${categoria === '' ? 'bg-primary text-on-primary' : 'border border-outline-soft'}`}
              type="button"
              onClick={() => setCategoria('')}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                className={`min-h-[44px] rounded-full px-4 text-sm font-bold ${categoria === c ? 'bg-primary text-on-primary' : 'border border-outline-soft'}`}
                type="button"
                onClick={() => setCategoria(categoria === c ? '' : c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {cargando ? (
        <p className="text-ink-soft">Cargando menú…</p>
      ) : visibles.length === 0 ? (
        <section className="card">
          <p className="text-ink-soft">
            {lineas.length === 0
              ? 'No hay platillos disponibles en el menú de hoy.'
              : `Sin resultados para ‘${texto}’.`}
          </p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibles.map((l) => {
            const enCaptura = items.find((i) => i.menuDiaId === l.id)
            return (
              <article key={l.id} className="card flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg font-bold">{l.platillo.nombre}</h2>
                  {l.especial && (
                    <span className="rounded-full bg-espresso px-3 py-1 text-xs font-bold text-white">
                      Especial
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-soft">
                  ${Number(l.precio).toFixed(2)} c/u
                </p>
                {!enCaptura ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="input-field min-h-[44px] w-20"
                      type="number"
                      min={1}
                      max={20}
                      value={cant}
                      onChange={(e) => setCant(Number(e.target.value))}
                      aria-label={`Cantidad de ${l.platillo.nombre}`}
                    />
                    <button
                      className="btn-secondary min-h-[44px]"
                      type="button"
                      onClick={() =>
                        agregar(
                          { menuDiaId: l.id, nombre: l.platillo.nombre, precio: Number(l.precio) },
                          Math.max(1, cant),
                        )
                      }
                      aria-label={`Agregar ${l.platillo.nombre}`}
                    >
                      Agregar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      className="btn-secondary min-h-[44px] min-w-[44px]"
                      type="button"
                      onClick={() => fijarCantidad(l.id, enCaptura.cantidad - 1)}
                      aria-label={`Quitar uno de ${l.platillo.nombre}`}
                    >
                      −
                    </button>
                    <strong aria-label={`Cantidad de ${l.platillo.nombre}`}>{enCaptura.cantidad}</strong>
                    <button
                      className="btn-secondary min-h-[44px] min-w-[44px]"
                      type="button"
                      onClick={() => fijarCantidad(l.id, enCaptura.cantidad + 1)}
                      aria-label={`Agregar uno más de ${l.platillo.nombre}`}
                    >
                      +
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {conteo > 0 && (
        <Link
          to="/caja/cobro"
          className="btn-primary fixed bottom-4 left-1/2 flex min-h-[48px] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-center"
        >
          Ver cobro · {conteo} platillos · ${total.toFixed(2)}
        </Link>
      )}
    </div>
  )
}
