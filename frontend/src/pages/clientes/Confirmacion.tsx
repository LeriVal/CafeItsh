import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, api } from '../../lib/api'
import StatusBadge from '../../components/StatusBadge'

interface PedidoDetalle {
  id: number
  numero: string
  estado: string
  total: string
  fechaRecoleccion: string | null
  detalle: Array<{
    menuDiaId: number
    nombre: string
    cantidad: number
    precioUnitario: string
    subtotal: string
  }>
  pagoReferencia: string | null
}

export default function Confirmacion() {
  const { id } = useParams()
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<{ pedido: PedidoDetalle }>(`/api/pedidos/${id}`)
      .then(({ pedido }) => setPedido(pedido))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo conectar'))
  }, [id])

  if (error) {
    return (
      <p role="alert" className="input-error">
        {error}
      </p>
    )
  }
  if (!pedido) return <p className="text-ink-soft">Cargando pedido…</p>

  const recogida = pedido.fechaRecoleccion
    ? new Date(pedido.fechaRecoleccion).toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <div className="flex flex-col gap-6">
      <section className="card">
        <p className="text-sm font-bold text-primary">¡Pedido confirmado!</p>
        <h1 className="font-display text-2xl font-bold">Folio {pedido.numero}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Estado: <StatusBadge estado={pedido.estado} /> · Recogida: {recogida}
        </p>
        {pedido.pagoReferencia && (
          <p className="mt-1 text-xs text-ink-soft">Referencia de pago: {pedido.pagoReferencia}</p>
        )}
      </section>

      <section className="card">
        <h2 className="font-bold">Detalle</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {pedido.detalle.map((d) => (
            <li key={d.menuDiaId} className="flex justify-between text-sm">
              <span>
                {d.cantidad} × {d.nombre}
              </span>
              <strong>${Number(d.subtotal).toFixed(2)}</strong>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between font-display text-lg font-bold">
          <span>Total pagado</span>
          <span>${Number(pedido.total).toFixed(2)}</span>
        </p>
      </section>

      <Link className="btn-secondary inline-flex items-center justify-center" to="/menu">
        Volver al menú
      </Link>
    </div>
  )
}
