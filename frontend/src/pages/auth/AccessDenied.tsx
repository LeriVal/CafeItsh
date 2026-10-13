import { Link } from 'react-router-dom'

export default function AccessDenied() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <div className="card">
        <h1 className="font-display text-xl font-bold">No tienes acceso a esta función</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Tu cuenta no tiene el rol necesario para ver esta pantalla.
        </p>
        <Link className="btn-secondary mt-6 inline-flex items-center justify-center" to="/login">
          Volver al inicio de sesión
        </Link>
      </div>
    </main>
  )
}
