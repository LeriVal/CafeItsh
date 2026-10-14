import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import { crearMostrador } from '../../lib/operacion'
import { useCaptura } from './CapturaContext'

export default function ResumenCobro() {
  const { items, total, cliente, fijarCliente, quitar, limpiar } = useCaptura()
  const navigate = useNavigate()
  const [monto, setMonto] = useState('')
  const [ticket, setTicket] = useState<{ numero: string; cambio: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cobrando, setCobrando] = useState(false)

  if (items.length === 0 && !ticket) {
    return (
      <section className="card">
        <h1 className="font-display text-xl font-bold">Sin captura</h1>
        <p className="mt-2 text-sm text-ink-soft">Agrega platillos para cobrar.</p>
        <Link className="btn-primary mt-4 inline-flex items-center justify-center" to="/caja/nuevo">
          Nuevo pedido
        </Link>
      </section>
    )
  }

  async function cobrar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setTicket(null)
    setCobrando(true)
    try {
      const data = await crearMostrador({
        items: items.map((i) => ({ menuDiaId: i.menuDiaId, cantidad: i.cantidad })),
        clienteNombre: cliente.trim() === '' ? undefined : cliente.trim(),
        montoRecibido: Number(monto),
      })
      setTicket({ numero: data.pedido.numero, cambio: data.cambio })
      limpiar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    } finally {
      setCobrando(false)
    }
  }

  if (ticket) {
    return (
      <section className="card">
        <p className="text-sm font-bold text-primary">Cobro confirmado</p>
        <h1 className="font-mono font-display text-2xl font-bold">{ticket.numero}</h1>
        <p className="mt-2">Cambio: ${Number(ticket.cambio).toFixed(2)}</p>
        <button className="btn-primary mt-4 w-full" type="button" onClick={() => navigate('/caja/nuevo')}>
          Nuevo pedido
        </button>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-bold">Resumen de cobro</h1>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}

      <section className="card">
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.menuDiaId} className="flex items-center justify-between text-sm">
              <span>
                {i.cantidad} × {i.nombre}
              </span>
              <span className="flex items-center gap-3">
                <strong>${(i.precio * i.cantidad).toFixed(2)}</strong>
                <button
                  className="text-sm font-bold text-error"
                  type="button"
                  onClick={() => quitar(i.menuDiaId)}
                  aria-label={`Quitar ${i.nombre}`}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between font-display text-2xl font-bold text-primary">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </p>
        <p className="mt-1 text-xs text-ink-soft">El pedido se registra y cobra en un solo paso.</p>
      </section>

      <section className="card">
        <form onSubmit={cobrar} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="input-label" htmlFor="r-cliente">Cliente (opcional)</label>
            <input
              id="r-cliente"
              className="input-field"
              value={cliente}
              onChange={(e) => fijarCliente(e.target.value)}
              placeholder="Nombre para llamar"
            />
          </div>
          <div>
            <label className="input-label" htmlFor="r-monto">Monto recibido</label>
            <input
              id="r-monto"
              className="input-field"
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary min-h-[48px]" type="submit" disabled={cobrando}>
            {cobrando ? 'Cobrando…' : 'Registrar y cobrar'}
          </button>
        </form>
      </section>
    </div>
  )
}
