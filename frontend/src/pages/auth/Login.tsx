import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import { ROL_HOME, useAuth } from '../../lib/auth'

export default function Login() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (usuario) {
    navigate(ROL_HOME[usuario.rol], { replace: true })
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const logged = await login(correo, password)
      navigate(ROL_HOME[logged.rol], { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold">Cafetería ITSH</h1>
        <p className="mt-1 text-sm text-ink-soft">Inicia sesión para continuar</p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
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
              Contraseña
            </label>
            <input
              id="password"
              className="input-field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p role="alert" className="input-error">
              {error}
            </p>
          )}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-4 text-sm text-ink-soft">
          ¿Eres alumno o docente? <Link className="font-bold text-primary" to="/registro">Crea tu cuenta</Link>
        </p>
      </div>
    </main>
  )
}
