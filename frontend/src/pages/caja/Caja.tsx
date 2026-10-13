import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, api } from '../../lib/api'
import { cambiarEstadoPedido, crearMostrador, listosCaja } from '../../lib/operacion'
import type { PedidoCola } from '../../lib/operacion'

interface LineaMenu {
  id: number
  precio: string
  disponible: boolean
  platillo: { nombre: string }
}

interface Captura {
  menuDiaId: number
  nombre: string
  precio: number
  cantidad: number
}

export default function Caja() {
  const [menu, setMenu] = useState<LineaMenu[]>([])
  const [captura, setCaptura] = useState<Captura[]>([])
  const [selId, setSelId] = useState('')
  const [selCant, setSelCant] = useState(1)
  const [cliente, setCliente] = useState('')
  const [monto, setMonto] = useState('')
  const [ticket, setTicket] = useState<{ numero: string; total: string; cambio: string } | null>(null)
  const [listos, setListos] = useState<PedidoCola[]>([])
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([
        api<{ lineas: LineaMenu[] }>('/api/menu'),
        listosCaja(),
      ])
      setMenu(m.lineas.filter((x) => x.disponible))
      setListos(l.pedidos)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const total = captura.reduce((acc, c) => acc + c.precio * c.cantidad, 0)

  function agregarLinea(e: FormEvent) {
    e.preventDefault()
    const linea = menu.find((m) => m.id === Number(selId))
    if (!linea || selCant < 1) return
    setCaptura((prev) => {
      const actual = prev.find((c) => c.menuDiaId === linea.id)
      if (!actual) {
        return [
          ...prev,
          { menuDiaId: linea.id, nombre: linea.platillo.nombre, precio: Number(linea.precio), cantidad: Math.min(20, selCant) },
        ]
      }
      return prev.map((c) =>
        c.menuDiaId === linea.id
          ? { ...c, cantidad: Math.min(20, c.cantidad + selCant) }
          : c,
      )
    })
    setSelId('')
    setSelCant(1)
  }

  async function cobrar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setTicket(null)
    try {
      const data = await crearMostrador({
        items: captura.map((c) => ({ menuDiaId: c.menuDiaId, cantidad: c.cantidad })),
        clienteNombre: cliente.trim() === '' ? undefined : cliente.trim(),
        montoRecibido: Number(monto),
      })
      setTicket({ numero: data.pedido.numero, total: data.pedido.total, cambio: data.cambio })
      setCaptura([])
      setCliente('')
      setMonto('')
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

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
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-bold">Caja</h1>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}

      <section className="card">
        <h2 className="font-bold">Capturar pedido de mostrador</h2>
        <form onSubmit={agregarLinea} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <label className="input-label" htmlFor="c-plat">Platillo</label>
            <select
              id="c-plat"
              className="input-field"
              value={selId}
              onChange={(e) => setSelId(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {menu.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.platillo.nombre} — ${Number(m.precio).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="input-label" htmlFor="c-cant">Cant.</label>
            <input
              id="c-cant"
              className="input-field"
              type="number"
              min={1}
              max={20}
              value={selCant}
              onChange={(e) => setSelCant(Number(e.target.value))}
            />
          </div>
          <button className="btn-secondary" type="submit">
            Agregar
          </button>
        </form>

        {captura.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {captura.map((c) => (
              <li key={c.menuDiaId} className="flex items-center justify-between text-sm">
                <span>
                  {c.cantidad} × {c.nombre}
                </span>
                <span className="flex items-center gap-3">
                  <strong>${(c.precio * c.cantidad).toFixed(2)}</strong>
                  <button
                    className="text-sm font-bold text-error"
                    type="button"
                    onClick={() => setCaptura(captura.filter((x) => x.menuDiaId !== c.menuDiaId))}
                    aria-label={`Quitar ${c.nombre}`}
                  >
                    Quitar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={cobrar} className="mt-4 grid gap-4 md:grid-cols-3" noValidate>
          <div>
            <label className="input-label" htmlFor="c-cliente">Cliente (opcional)</label>
            <input
              id="c-cliente"
              className="input-field"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre para llamar"
            />
          </div>
          <div>
            <label className="input-label" htmlFor="c-monto">Monto recibido</label>
            <input
              id="c-monto"
              className="input-field"
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" type="submit" disabled={captura.length === 0}>
              Cobrar ${total.toFixed(2)}
            </button>
          </div>
        </form>

        {ticket && (
          <p className="mt-4 rounded-lg bg-primary-container p-3 font-bold" role="status">
            {ticket.numero} cobrado · Cambio: ${Number(ticket.cambio).toFixed(2)}
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="font-bold">Por entregar ({listos.length})</h2>
        {listos.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Nada pendiente de entrega.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {listos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-soft pt-3">
                <span>
                  <strong className="font-display">{p.numero}</strong>{' '}
                  <span className="text-sm text-ink-soft">{p.cliente}</span>
                </span>
                <span className="flex gap-2">
                  <button
                    className="btn-primary min-h-[44px] text-sm"
                    type="button"
                    onClick={() => void entregar(p.id, 'Entregado')}
                  >
                    Entregar
                  </button>
                  <button
                    className="btn-secondary min-h-[44px] text-sm"
                    type="button"
                    onClick={() => void entregar(p.id, 'Cancelado')}
                  >
                    Cancelar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
