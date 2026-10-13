import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { AuthProvider } from '../src/lib/auth'
import { CartProvider } from '../src/lib/carrito'
import MisPedidos from '../src/pages/clientes/MisPedidos'

const PEDIDOS = [
  {
    id: 51,
    numero: 'A-20261013-0051',
    tipo: 'anticipado',
    estado: 'Listo',
    total: '70.00',
    fechaRecoleccion: new Date(Date.now() + 3600_000).toISOString(),
    detalle: [{ menuDiaId: 11, nombre: 'Gordita', cantidad: 2, precioUnitario: '35.00', subtotal: '70.00' }],
    pagoReferencia: 'SIM-X',
  },
  {
    id: 52,
    numero: 'A-20261013-0052',
    tipo: 'anticipado',
    estado: 'En preparación',
    total: '20.00',
    fechaRecoleccion: new Date(Date.now() + 3600_000).toISOString(),
    detalle: [{ menuDiaId: 12, nombre: 'Café', cantidad: 1, precioUnitario: '20.00', subtotal: '20.00' }],
    pagoReferencia: 'SIM-Y',
  },
]

const AVISOS = [
  { id: 7, pedidoId: 51, numero: 'A-20261013-0051', tipo: 'pedido_listo', leida: false, fecha: new Date().toISOString() },
]

function mockFetch(impl: (url: string) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown) => {
      const u = String(url)
      if (u.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            usuario: { id: 9, nombre: 'Alu', correo: 'a@itsh.edu.mx', rol: 'usuario' },
          }),
        }
      }
      return impl(u)
    }),
  )
}

function renderMis() {
  localStorage.setItem('itsh.token', 'tok')
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <MisPedidos />
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

describe('mis pedidos', () => {
  it('lista con badges de estado y detalle desplegable', async () => {
    const user = userEvent.setup()
    mockFetch((u) => {
      if (u.includes('/api/pedidos/mios')) return { ok: true, json: async () => ({ pedidos: PEDIDOS }) }
      if (u.includes('/api/avisos')) return { ok: true, json: async () => ({ avisos: [] }) }
      throw new Error(u)
    })
    renderMis()
    await waitFor(() => {
      expect(screen.getByText('A-20261013-0051')).toBeInTheDocument()
    })
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText('En preparación')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ver detalle de A-20261013-0051/i }))
    expect(
      await screen.findByText((_, el) => el?.textContent === '2 × Gordita'),
    ).toBeInTheDocument()
  })

  it('banner de aviso con marcar visto', async () => {
    const user = userEvent.setup()
    let marcadas = 0
    mockFetch((u: string) => {
      if (u.includes('/api/pedidos/mios')) return { ok: true, json: async () => ({ pedidos: PEDIDOS }) }
      if (u.includes('/leida')) {
        marcadas += 1
        return { ok: true, json: async () => ({ aviso: { ...AVISOS[0], leida: true } }) }
      }
      if (u.includes('/api/avisos')) return { ok: true, json: async () => ({ avisos: AVISOS }) }
      throw new Error(u)
    })
    renderMis()
    await waitFor(() => {
      expect(screen.getByText(/listo para recoger/i)).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /marcar como visto/i }))
    await waitFor(() => {
      expect(marcadas).toBe(1)
    })
  })

  it('sin pedidos muestra mensaje claro', async () => {
    mockFetch((u) => {
      if (u.includes('/api/pedidos/mios')) return { ok: true, json: async () => ({ pedidos: [] }) }
      if (u.includes('/api/avisos')) return { ok: true, json: async () => ({ avisos: [] }) }
      throw new Error(u)
    })
    renderMis()
    await waitFor(() => {
      expect(screen.getByText(/aún no tienes pedidos/i)).toBeInTheDocument()
    })
  })
})
