import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { AuthProvider } from '../src/lib/auth'
import { CartProvider } from '../src/lib/carrito'
import Admin from '../src/pages/admin/Admin'

function mockFetch(impl: (url: string) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown) => {
      const u = String(url)
      if (u.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            usuario: { id: 1, nombre: 'Admin', correo: 'a@itsh.edu.mx', rol: 'administrador' },
          }),
        }
      }
      return impl(u)
    }),
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('admin landing', () => {
  it('muestra conteos y resumen del menú con especiales', async () => {
    mockFetch((u) => {
      if (u.includes('/api/usuarios')) {
        return { ok: true, json: async () => ({ usuarios: [{ activo: true }, { activo: false }] }) }
      }
      if (u.includes('/api/platillos')) {
        return { ok: true, json: async () => ({ platillos: [{}, {}, {}] }) }
      }
      if (u.includes('/api/menu')) {
        return {
          ok: true,
          json: async () => ({
            fecha: '2026-10-14',
            lineas: [
              { id: 1, precio: '35.00', disponible: true, especial: true, platillo: { nombre: 'Gordita' } },
              { id: 2, precio: '20.00', disponible: false, especial: false, platillo: { nombre: 'Café' } },
            ],
          }),
        }
      }
      throw new Error(u)
    })
    localStorage.setItem('itsh.token', 'tok')
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/admin/*" element={<Admin />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Usuarios activos')).toBeInTheDocument()
    expect(screen.getByText('Especial')).toBeInTheDocument()
    expect(screen.getByText('No disponible')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /platillos en catálogo/i }).textContent).toContain('3')
  })
})
