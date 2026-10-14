import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import App from '../src/App'

/** Regresión: las subrutas de /caja/* deben resolver (antes caían en 404). */
function mockCajero() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown) => {
      const u = String(url)
      if (u.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            usuario: { id: 2, nombre: 'Caja', correo: 'c@itsh.edu.mx', rol: 'cajero' },
          }),
        }
      }
      if (u.includes('/api/menu')) {
        return { ok: true, json: async () => ({ fecha: '2026-10-14', lineas: [] }) }
      }
      if (u.includes('/api/caja/listos')) {
        return { ok: true, json: async () => ({ pedidos: [] }) }
      }
      throw new Error(u)
    }),
  )
}

function renderApp(ruta: string) {
  localStorage.setItem('itsh.token', 'tok')
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('rutas de App', () => {
  it('/caja/nuevo muestra Nuevo pedido (no 404)', async () => {
    mockCajero()
    renderApp('/caja/nuevo')
    expect(await screen.findByText('Nuevo pedido')).toBeInTheDocument()
    expect(screen.queryByText('Página no encontrada')).not.toBeInTheDocument()
  })

  it('/caja/entregas muestra Entregas (no 404)', async () => {
    mockCajero()
    renderApp('/caja/entregas')
    expect(await screen.findByText(/por entregar|nada pendiente|listos/i)).toBeInTheDocument()
    expect(screen.queryByText('Página no encontrada')).not.toBeInTheDocument()
  })
})
