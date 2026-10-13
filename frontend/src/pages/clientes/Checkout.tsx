import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../../lib/api'
import { useCart } from '../../lib/carrito'

function aDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Checkout() {
  const { items, total, limpiar } = useCart()
  const navigate = useNavigate()
  const [recogida, setRecogida] = useState(() => aDatetimeLocal(new Date(Date.now() + 30 * 60_000)))
  const [error, setError] = useState<string | null>(null)
  const [pedidoPendiente, setPedidoPendiente] = useState<number | null>(null)
  const [pagando, setPagando] = useState(false)

  if (items.length === 0 && pedidoPendiente === null) {
    return (
      <section className="card">
        <h1 className="font-display text-xl font-bold">Tu pedido está vacío</h1>
        <p className="mt-2 text-ink-soft">Agrega platillos desde el menú para continuar.</p>
        <Link className="btn-primary mt-4 inline-flex items-center justify-center" to="/menu">
          Ver menú
        </Link>
      </section>
    )
  }

  async function pagar(pedidoId: number): Promise<boolean> {
    try {
      await api(`/api/pedidos/${pedidoId}/pagar`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      limpiar()
      navigate(`/pedido/${pedidoId}`)
      return true
    } catch (err) {
      if (err instanceof ApiError && err.code === 'PAGO_RECHAZADO') {
        setPedidoPendiente(pedidoId)
        setError('El pago fue rechazado; tu pedido sigue pendiente y puedes reintentar')
      } else {
        setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
      }
      return false
    }
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (new Date(recogida).getTime() < Date.now() + 10 * 60_000) {
      setError('El pedido anticipado requiere al menos 10 minutos de anticipación')
      return
    }
    setPagando(true)
    try {
      if (pedidoPendiente !== null) {
        await pagar(pedidoPendiente)
        return
      }
      const data = await api<{ pedido: { id: number } }>('/api/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((i) => ({ menuDiaId: i.menuDiaId, cantidad: i.cantidad })),
          fechaRecoleccion: new Date(recogida).toISOString(),
        }),
      })
      await pagar(data.pedido.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    } finally {
      setPagando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-bold">Confirmar pedido</h1>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}

      <section className="card">
        <h2 className="font-bold">Resumen</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.menuDiaId} className="flex justify-between text-sm">
              <span>
                {i.cantidad} × {i.nombre}
              </span>
              <strong>${(i.precio * i.cantidad).toFixed(2)}</strong>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between font-display text-lg font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          Total informativo; el servidor confirma el total final.
        </p>
      </section>

      <section className="card">
        <form onSubmit={confirmar} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="input-label" htmlFor="recogida">
              Hora de recogida (al menos 10 minutos después)
            </label>
            <input
              id="recogida"
              className="input-field"
              type="datetime-local"
              value={recogida}
              min={aDatetimeLocal(new Date(Date.now() + 10 * 60_000))}
              onChange={(e) => setRecogida(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={pagando}>
            {pagando ? 'Procesando…' : pedidoPendiente !== null ? 'Reintentar pago' : 'Confirmar y pagar'}
          </button>
        </form>
      </section>
    </div>
  )
}
