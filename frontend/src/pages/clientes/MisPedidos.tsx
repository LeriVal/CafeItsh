import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import { SONDEO_MS } from '../../lib/operacion'
import { marcarVista, misAvisos, misPedidos } from '../../lib/seguimiento'
import type { Aviso, MiPedido } from '../../lib/seguimiento'
import StatusBadge from '../../components/StatusBadge'

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState<MiPedido[]>([])
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [abierto, setAbierto] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([misPedidos(), misAvisos()])
      setPedidos(p.pedidos)
      setAvisos(a.avisos.filter((x) => !x.leida))
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

  async function verAviso(id: number) {
    try {
      await marcarVista(id)
      setAvisos((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold">Mis pedidos</h1>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}

      {avisos.map((a) => (
        <section key={a.id} className="card border-2 border-status-ready" aria-label="Aviso de pedido listo">
          <p className="font-bold text-status-ready">
            ¡Tu pedido {a.numero} está listo para recoger!
          </p>
          <button
            className="btn-secondary mt-3 min-h-[44px] text-sm"
            type="button"
            onClick={() => void verAviso(a.id)}
          >
            Marcar como visto
          </button>
        </section>
      ))}

      {cargando ? (
        <p className="text-ink-soft">Cargando tus pedidos…</p>
      ) : pedidos.length === 0 ? (
        <section className="card">
          <p className="text-ink-soft">
            Aún no tienes pedidos. <Link className="font-bold text-primary" to="/menu">Ver menú</Link>
          </p>
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          {pedidos.map((p) => (
            <article key={p.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold">{p.numero}</h2>
                <StatusBadge estado={p.estado} />
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                Total ${Number(p.total).toFixed(2)}
                {p.fechaRecoleccion
                  ? ` · Recogida ${new Date(p.fechaRecoleccion).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </p>
              <button
                className="btn-secondary mt-3 min-h-[44px] text-sm"
                type="button"
                onClick={() => setAbierto(abierto === p.id ? null : p.id)}
                aria-expanded={abierto === p.id}
              >
                {abierto === p.id ? 'Ocultar detalle' : `Ver detalle de ${p.numero}`}
              </button>
              {abierto === p.id && (
                <ul className="mt-3 flex flex-col gap-2 border-t border-outline-soft pt-3">
                  {p.detalle.map((d) => (
                    <li key={d.menuDiaId} className="flex justify-between text-sm">
                      <span>
                        {d.cantidad} × {d.nombre}
                      </span>
                      <strong>${Number(d.subtotal).toFixed(2)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
