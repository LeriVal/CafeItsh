import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, api } from '../../lib/api'

export interface Platillo {
  id: number
  nombre: string
  categoria: string | null
  descripcion: string | null
  activo: boolean
}

const emptyForm = { nombre: '', categoria: '', descripcion: '' }

export default function Platillos() {
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [soloActivos, setSoloActivos] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editando, setEditando] = useState<Platillo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const data = await api<{ platillos: Platillo[] }>(
        `/api/platillos${soloActivos ? '?activos=true' : ''}`,
      )
      setPlatillos(data.platillos)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    } finally {
      setCargando(false)
    }
  }, [soloActivos])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setAviso(null)
    try {
      await api('/api/platillos', { method: 'POST', body: JSON.stringify(form) })
      setForm(emptyForm)
      setAviso('Platillo creado')
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  async function guardarEdicion(e: FormEvent) {
    e.preventDefault()
    if (!editando) return
    setError(null)
    setAviso(null)
    try {
      await api(`/api/platillos/${editando.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: editando.nombre,
          categoria: editando.categoria ?? '',
          descripcion: editando.descripcion ?? '',
        }),
      })
      setEditando(null)
      setAviso('Platillo actualizado')
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  async function cambiarActivo(p: Platillo) {
    setError(null)
    setAviso(null)
    try {
      await api(`/api/platillos/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !p.activo }),
      })
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  if (cargando) return <p className="text-ink-soft">Cargando platillos…</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-bold">Platillos</h1>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}
      {aviso && <p className="text-sm text-primary">{aviso}</p>}

      <section className="card">
        <h2 className="font-bold">Crear platillo</h2>
        <form onSubmit={crear} className="mt-4 grid gap-4 md:grid-cols-3" noValidate>
          <div>
            <label className="input-label" htmlFor="p-nombre">Nombre</label>
            <input
              id="p-nombre"
              className="input-field"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="input-label" htmlFor="p-cat">Categoría</label>
            <input
              id="p-cat"
              className="input-field"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              placeholder="Comida, Bebida…"
            />
          </div>
          <div>
            <label className="input-label" htmlFor="p-desc">Descripción</label>
            <input
              id="p-desc"
              className="input-field"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <button className="btn-primary" type="submit">
              Crear platillo
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Catálogo ({platillos.length})</h2>
          <label className="flex min-h-[44px] items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={(e) => setSoloActivos(e.target.checked)}
              className="h-5 w-5"
            />
            Solo activos
          </label>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-container">
                <th className="p-3">Nombre</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {platillos.map((p) => (
                <tr key={p.id} className="border-t border-outline-soft">
                  <td className="p-3 font-bold">{p.nombre}</td>
                  <td className="p-3">{p.categoria ?? '—'}</td>
                  <td className="p-3">{p.activo ? 'Activo' : 'Inactivo'}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <button
                      className="btn-secondary min-h-[44px] text-sm"
                      type="button"
                      onClick={() => setEditando({ ...p })}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-secondary min-h-[44px] text-sm"
                      type="button"
                      onClick={() => void cambiarActivo(p)}
                    >
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editando && (
        <section className="card" aria-label="Editar platillo">
          <h2 className="font-bold">Editar platillo</h2>
          <form onSubmit={guardarEdicion} className="mt-4 grid gap-4 md:grid-cols-3" noValidate>
            <div>
              <label className="input-label" htmlFor="e-nombre">Nombre</label>
              <input
                id="e-nombre"
                className="input-field"
                value={editando.nombre}
                onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label" htmlFor="e-cat">Categoría</label>
              <input
                id="e-cat"
                className="input-field"
                value={editando.categoria ?? ''}
                onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="e-desc">Descripción</label>
              <input
                id="e-desc"
                className="input-field"
                value={editando.descripcion ?? ''}
                onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
              />
            </div>
            <div className="flex gap-2 md:col-span-3">
              <button className="btn-primary" type="submit">
                Guardar
              </button>
              <button className="btn-secondary" type="button" onClick={() => setEditando(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
