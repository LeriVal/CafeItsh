import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../../lib/api'
import { useAuth } from '../../lib/auth'

export default function Register() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (usuario) {
    navigate('/menu', { replace: true })
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nombre, correo, password }),
      })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-ink-soft">Para alumnos y docentes de la cafetería</p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <div>
            <label className="input-label" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              className="input-field"
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="input-label" htmlFor="correo">
              Correo electrónico
            </label>
            <input
              id="correo"
              className="input-field"
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="input-label" htmlFor="password">
              Contraseña (mínimo 8 caracteres)
            </label>
            <input
              id="password"
              className="input-field"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && (
            <p role="alert" className="input-error">
              {error}
            </p>
          )}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
        <p className="mt-4 text-sm text-ink-soft">
          ¿Ya tienes cuenta? <Link className="font-bold text-primary" to="/login">Inicia sesión</Link>
        </p>
      </div>
    </main>
  )
}
