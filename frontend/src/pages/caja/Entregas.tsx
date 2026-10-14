import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../lib/api'
import { buscarPorFolio, cambiarEstadoPedido, listosCaja } from '../../lib/operacion'
import type { PedidoCola, PedidoDetalle } from '../../lib/operacion'
import StatusBadge from '../../components/StatusBadge'

export default function Entregas() {
  const [pedidos, setPedidos] = useState<PedidoCola[]>([])
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [folio, setFolio] = useState('')
  const [hallado, setHallado] = useState<PedidoDetalle | null>(null)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)

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
    setAviso(null)
    try {
      await cambiarEstadoPedido(id, estado)
      setAviso(estado === 'Entregado' ? 'Pedido entregado.' : 'Pedido cancelado.')
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  async function buscar(e: FormEvent) {
    e.preventDefault()
    setErrorBusqueda(null)
    setHallado(null)
    try {
      const data = await buscarPorFolio(folio)
      setHallado(data.pedido)
    } catch (err) {
      setErrorBusqueda(err instanceof ApiError ? err.message : 'No se pudo conectar')
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
      {aviso && (
        <p role="status" className="text-sm font-bold text-primary">
          {aviso}
        </p>
      )}

      <section className="card">
        <h2 className="font-bold">Buscar pedido por folio</h2>
        <form onSubmit={buscar} className="mt-3 flex gap-2">
          <input
            className="input-field"
            placeholder="A-20261014-0001"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            aria-label="Folio del pedido"
          />
          <button className="btn-secondary min-h-[44px]" type="submit">
            Buscar
          </button>
        </form>
        {errorBusqueda && (
          <p role="alert" className="input-error mt-2">
            {errorBusqueda}
          </p>
        )}
        {hallado && (
          <article className="mt-3 rounded-lg border border-outline-soft p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="font-mono font-display text-lg">{hallado.numero}</strong>
              <StatusBadge estado={hallado.estado} />
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {hallado.detalle.map((d) => (
                <li key={d.menuDiaId} className="flex justify-between text-sm">
                  <span>
                    {d.cantidad} × {d.nombre}
                  </span>
                  <strong>${Number(d.subtotal).toFixed(2)}</strong>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between text-sm font-bold">
              <span>Total</span>
              <span>${Number(hallado.total).toFixed(2)}</span>
            </p>
          </article>
        )}
      </section>

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
