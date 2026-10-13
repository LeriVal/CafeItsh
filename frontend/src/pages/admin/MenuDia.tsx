import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, api } from '../../lib/api'

export interface LineaMenu {
  id: number
  fecha: string
  precio: string
  disponible: boolean
  especial: boolean
  platillo: { id: number; nombre: string; categoria: string | null; descripcion: string | null }
}

interface PlatilloOpcion {
  id: number
  nombre: string
}

function hoyLocal(): string {
  return new Date().toLocaleDateString('en-CA')
}

export default function MenuDia() {
  const [fecha, setFecha] = useState(hoyLocal())
  const [lineas, setLineas] = useState<LineaMenu[]>([])
  const [opciones, setOpciones] = useState<PlatilloOpcion[]>([])
  const [nuevo, setNuevo] = useState({ platilloId: '', precio: '', especial: false })
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async (dia: string) => {
    setCargando(true)
    try {
      const [menu, plats] = await Promise.all([
        api<{ fecha: string; lineas: LineaMenu[] }>(`/api/menu?fecha=${dia}`),
        api<{ platillos: PlatilloOpcion[] }>('/api/platillos?activos=true'),
      ])
      setLineas(menu.lineas)
      setOpciones(plats.platillos)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar(fecha)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  async function agregar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setAviso(null)
    try {
      await api('/api/menu', {
        method: 'POST',
        body: JSON.stringify({
          fecha,
          platilloId: Number(nuevo.platilloId),
          precio: Number(nuevo.precio),
          especial: nuevo.especial,
        }),
      })
      setNuevo({ platilloId: '', precio: '', especial: false })
      setAviso('Línea agregada al menú')
      await cargar(fecha)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  async function modificar(id: number, cambios: { precio?: number; disponible?: boolean; especial?: boolean }) {
    setError(null)
    setAviso(null)
    try {
      await api(`/api/menu/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) })
      await cargar(fecha)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  async function quitar(id: number) {
    setError(null)
    setAviso(null)
    try {
      await api(`/api/menu/${id}`, { method: 'DELETE' })
      setAviso('Línea quitada')
      await cargar(fecha)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold">Menú del día</h1>
        <input
          className="input-field w-auto"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          aria-label="Fecha del menú"
        />
      </div>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}
      {aviso && <p className="text-sm text-primary">{aviso}</p>}

      <section className="card">
        <h2 className="font-bold">Agregar platillo al menú</h2>
        <form onSubmit={agregar} className="mt-4 grid gap-4 md:grid-cols-4" noValidate>
          <div className="md:col-span-2">
            <label className="input-label" htmlFor="m-plat">Platillo (solo activos)</label>
            <select
              id="m-plat"
              className="input-field"
              value={nuevo.platilloId}
              onChange={(e) => setNuevo({ ...nuevo, platilloId: e.target.value })}
              required
            >
              <option value="">Seleccionar…</option>
              {opciones.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label" htmlFor="m-precio">Precio</label>
            <input
              id="m-precio"
              className="input-field"
              type="number"
              min="0.01"
              step="0.01"
              value={nuevo.precio}
              onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })}
              required
            />
          </div>
          <div className="flex items-end gap-4 pb-1">
            <label className="flex min-h-[44px] items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={nuevo.especial}
                onChange={(e) => setNuevo({ ...nuevo, especial: e.target.checked })}
                className="h-5 w-5"
              />
              Especial
            </label>
            <button className="btn-primary" type="submit">
              Agregar
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2 className="font-bold">Líneas del {fecha} ({lineas.length})</h2>
        {cargando ? (
          <p className="mt-2 text-ink-soft">Cargando…</p>
        ) : lineas.length === 0 ? (
          <p className="mt-2 text-ink-soft">Aún no hay platillos para esta fecha.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-container">
                  <th className="p-3">Platillo</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Disponible</th>
                  <th className="p-3">Especial</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l) => (
                  <tr key={l.id} className="border-t border-outline-soft">
                    <td className="p-3 font-bold">{l.platillo.nombre}</td>
                    <td className="p-3">
                      <input
                        className="input-field min-h-[44px] w-28"
                        type="number"
                        min="0.01"
                        step="0.01"
                        defaultValue={l.precio}
                        key={`${l.id}-${l.precio}`}
                        onBlur={(e) => {
                          const v = Number(e.target.value)
                          if (v > 0 && v !== Number(l.precio)) void modificar(l.id, { precio: v })
                        }}
                        aria-label={`Precio de ${l.platillo.nombre}`}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={l.disponible}
                        onChange={(e) => void modificar(l.id, { disponible: e.target.checked })}
                        className="h-5 w-5"
                        aria-label={`Disponibilidad de ${l.platillo.nombre}`}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={l.especial}
                        onChange={(e) => void modificar(l.id, { especial: e.target.checked })}
                        className="h-5 w-5"
                        aria-label={`Especial ${l.platillo.nombre}`}
                      />
                    </td>
                    <td className="p-3">
                      <button
                        className="btn-secondary min-h-[44px] text-sm"
                        type="button"
                        onClick={() => void quitar(l.id)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
