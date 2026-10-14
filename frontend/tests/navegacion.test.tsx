import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import AppShell from '../src/components/AppShell'
import { BottomBarCliente } from '../src/components/BottomBar'
import { AuthProvider } from '../src/lib/auth'
import { CartProvider } from '../src/lib/carrito'

function mockAuth(rol = 'usuario') {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown) => {
      const u = String(url)
      if (u.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            usuario: { id: 9, nombre: 'Alu', correo: 'a@itsh.edu.mx', rol },
          }),
        }
      }
      if (u.includes('/api/avisos')) {
        return {
          ok: true,
          json: async () => ({
            avisos: [{ id: 1, pedidoId: 5, numero: 'A-1', tipo: 'pedido_listo', leida: false, fecha: '' }],
          }),
        }
      }
      throw new Error(u)
    }),
  )
}

function renderShell(barra?: React.ReactNode) {
  localStorage.setItem('itsh.token', 'tok')
  return render(
    <MemoryRouter initialEntries={['/menu']}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<p>PÁGINA ENTRAR</p>} />
            <Route path="/menu" element={<AppShell barra={barra}><p>CONTENIDO</p></AppShell>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('navegación', () => {
  it('drawer abre con secciones y cierra sesión a /login', async () => {
    const user = userEvent.setup()
    mockAuth()
    renderShell()
    await waitFor(() => {
      expect(screen.getByText('CONTENIDO')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.getByText('Menú del día')).toBeInTheDocument()
    expect(screen.getByText('Mis pedidos')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await waitFor(() => {
      expect(screen.getByText('PÁGINA ENTRAR')).toBeInTheDocument()
    })
    expect(localStorage.getItem('itsh.token')).toBeNull()
  })

  it('bottom bar de cliente muestra badge de listos', async () => {
    mockAuth()
    renderShell(<BottomBarCliente />)
    expect(await screen.findByLabelText('1 listos para recoger')).toBeInTheDocument()
  })
})
