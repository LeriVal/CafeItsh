import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ApiError } from '../../lib/api'
import { listosCaja } from '../../lib/operacion'

export default function InicioCaja() {
  const [pendientes, setPendientes] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listosCaja()
      .then(({ pedidos }) => setPendientes(pedidos.length))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo conectar'))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-bold">Caja</h1>
        <p className="text-sm text-ink-soft">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/caja/nuevo" className="card">
          <p className="font-display text-xl font-bold">Capturar pedido</p>
          <p className="text-sm text-ink-soft">Catálogo, cobro en un paso</p>
        </Link>
        <Link to="/caja/entregas" className="card">
          <p className="font-display text-xl font-bold">
            Entregas {pendientes > 0 && <span>({pendientes} por entregar)</span>}
          </p>
          <p className="text-sm text-ink-soft">Pedidos listos para recoger</p>
        </Link>
      </div>
    </div>
  )
}
