import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../lib/api'
import { cambiarEstadoPedido, listosCaja } from '../../lib/operacion'
import type { PedidoCola } from '../../lib/operacion'

export default function Entregas() {
  const [pedidos, setPedidos] = useState<PedidoCola[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const data = await listosCaja()
      setPedidos(data.pedidos)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function entregar(id: number, estado: 'Entregado' | 'Cancelado') {
    setError(null)
    try {
      await cambiarEstadoPedido(id, estado)
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold">Entregas ({pedidos.length})</h1>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-ink-soft">Cargando…</p>
      ) : pedidos.length === 0 ? (
        <section className="card">
          <p className="text-ink-soft">¡Todo está al día! No hay pedidos listos por entregar.</p>
        </section>
      ) : (
        <ul className="flex flex-col gap-4">
          {pedidos.map((p) => (
            <li key={p.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="font-mono font-display text-xl">{p.numero}</strong>
                <span className="text-sm text-ink-soft">{p.cliente}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {p.lineas.map((l) => `${l.cantidad}× ${l.nombre}`).join(' · ')}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-primary min-h-[44px] flex-1 text-sm"
                  type="button"
                  onClick={() => void entregar(p.id, 'Entregado')}
                >
                  Entregar
                </button>
                <button
                  className="btn-secondary min-h-[44px] flex-1 text-sm"
                  type="button"
                  onClick={() => void entregar(p.id, 'Cancelado')}
                >
                  Cancelar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
