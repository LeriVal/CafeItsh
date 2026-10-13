import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../lib/api'
import { SONDEO_MS, cambiarEstadoPedido, colaCocina } from '../../lib/operacion'
import type { PedidoCola } from '../../lib/operacion'

const SIGUIENTE: Record<string, { estado: string; etiqueta: string }> = {
  Pagado: { estado: 'En preparación', etiqueta: 'Iniciar preparación' },
  'En preparación': { estado: 'Listo', etiqueta: 'Marcar listo' },
}

export default function Cocina() {
  const [pedidos, setPedidos] = useState<PedidoCola[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [actualizado, setActualizado] = useState<Date | null>(null)

  const cargar = useCallback(async () => {
    try {
      const data = await colaCocina()
      setPedidos(data.pedidos)
      setActualizado(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sin conexión; reintentando…')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
    const id = setInterval(() => void cargar(), SONDEO_MS)
    return () => clearInterval(id)
  }, [cargar])

  async function avanzar(p: PedidoCola) {
    const siguiente = SIGUIENTE[p.estado]
    if (!siguiente) return
    setError(null)
    try {
      await cambiarEstadoPedido(p.id, siguiente.estado)
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold">Cocina ({pedidos.length})</h1>
        <div className="flex items-center gap-3">
          {actualizado && (
            <span className="text-xs text-ink-soft">
              Actualizado {actualizado.toLocaleTimeString('es-MX')}
            </span>
          )}
          <button className="btn-secondary min-h-[44px] text-sm" type="button" onClick={() => void cargar()}>
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-ink-soft">Cargando pedidos…</p>
      ) : pedidos.length === 0 ? (
        <section className="card">
          <p className="text-ink-soft">Sin pedidos por preparar. Todo al día.</p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pedidos.map((p) => (
            <article key={p.id} className="card border-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-2xl font-bold">{p.numero}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                    p.tipo === 'anticipado' ? 'bg-primary' : 'bg-espresso'
                  }`}
                >
                  {p.tipo === 'anticipado' ? 'Anticipado' : 'Mostrador'}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {p.cliente} · {p.esperaMinutos} min en espera · {p.estado}
              </p>
              <ul className="mt-3 flex flex-col gap-1 border-t border-outline-soft pt-3">
                {p.lineas.map((l, i) => (
                  <li key={i} className="flex justify-between text-lg">
                    <span className="font-bold">{l.cantidad} × {l.nombre}</span>
                  </li>
                ))}
              </ul>
              {SIGUIENTE[p.estado] && (
                <button
                  className="btn-primary mt-4 min-h-[48px] w-full text-lg"
                  type="button"
                  onClick={() => void avanzar(p)}
                >
                  {SIGUIENTE[p.estado].etiqueta}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
