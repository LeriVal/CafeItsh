import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, api } from '../../lib/api'

interface Operativo {
  id: number
  nombre: string
  correo: string
  rol: 'cajero' | 'cocinero' | 'administrador' | 'usuario'
  activo: boolean
}

const emptyForm = { nombre: '', correo: '', password: '', rol: 'cajero' }

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Operativo[]>([])
  const [filtro, setFiltro] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const data = await api<{ usuarios: Operativo[] }>('/api/usuarios')
      setUsuarios(data.usuarios)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setAviso(null)
    try {
      await api('/api/usuarios', { method: 'POST', body: JSON.stringify(form) })
      setForm(emptyForm)
      setAviso('Cuenta operativa creada')
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  async function cambiar(id: number, cambios: { rol?: string; activo?: boolean }) {
    setError(null)
    setAviso(null)
    try {
      await api(`/api/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) })
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    }
  }

  const visibles = usuarios.filter(
    (u) =>
      filtro === '' ||
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      u.correo.toLowerCase().includes(filtro.toLowerCase()) ||
      u.rol === filtro,
  )

  if (cargando) return <p className="text-ink-soft">Cargando usuarios…</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-bold">Usuarios operativos</h1>

      {error && (
        <p role="alert" className="input-error">
          {error}
        </p>
      )}
      {aviso && <p className="text-sm text-primary">{aviso}</p>}

      <section className="card">
        <h2 className="font-bold">Crear cajero o cocinero</h2>
        <form onSubmit={crear} className="mt-4 grid gap-4 md:grid-cols-2" noValidate>
          <div>
            <label className="input-label" htmlFor="u-nombre">Nombre</label>
            <input
              id="u-nombre"
              className="input-field"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="input-label" htmlFor="u-correo">Correo</label>
            <input
              id="u-correo"
              className="input-field"
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="input-label" htmlFor="u-pass">Contraseña (mínimo 8)</label>
            <input
              id="u-pass"
              className="input-field"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="input-label" htmlFor="u-rol">Rol</label>
            <select
              id="u-rol"
              className="input-field"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
            >
              <option value="cajero">Cajero</option>
              <option value="cocinero">Cocinero</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary" type="submit">
              Crear cuenta
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Cuentas ({visibles.length})</h2>
          <input
            className="input-field max-w-xs"
            placeholder="Buscar por nombre, correo o rol"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            aria-label="Buscar usuarios"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-container">
                <th className="p-3">Nombre</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((u) => (
                <tr key={u.id} className="border-t border-outline-soft">
                  <td className="p-3 font-bold">{u.nombre}</td>
                  <td className="p-3">{u.correo}</td>
                  <td className="p-3">
                    <select
                      className="input-field min-h-[44px] w-auto"
                      value={u.rol}
                      onChange={(e) => void cambiar(u.id, { rol: e.target.value })}
                      aria-label={`Rol de ${u.nombre}`}
                    >
                      <option value="cajero">Cajero</option>
                      <option value="cocinero">Cocinero</option>
                      <option value="administrador">Administrador</option>
                      <option value="usuario">Cliente</option>
                    </select>
                  </td>
                  <td className="p-3">{u.activo ? 'Activa' : 'Deshabilitada'}</td>
                  <td className="p-3">
                    <button
                      className="btn-secondary min-h-[44px] text-sm"
                      type="button"
                      onClick={() => void cambiar(u.id, { activo: !u.activo })}
                    >
                      {u.activo ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
