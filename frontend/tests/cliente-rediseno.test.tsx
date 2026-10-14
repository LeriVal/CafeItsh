import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { AuthProvider } from '../src/lib/auth'
import { CartProvider } from '../src/lib/carrito'
import Checkout from '../src/pages/clientes/Checkout'
import Confirmacion from '../src/pages/clientes/Confirmacion'
import Menu from '../src/pages/clientes/Menu'
import MisPedidos from '../src/pages/clientes/MisPedidos'

const MENU = {
  fecha: '2026-10-14',
  lineas: [
    {
      id: 11,
      fecha: '2026-10-14',
      precio: '35.00',
      disponible: true,
      especial: true,
      platillo: { id: 1, nombre: 'Gordita', categoria: 'Comida', descripcion: 'Rica' },
    },
    {
      id: 12,
      fecha: '2026-10-14',
      precio: '20.00',
      disponible: true,
      especial: false,
      platillo: { id: 5, nombre: 'Café', categoria: 'Bebida', descripcion: '' },
    },
  ],
}

function mockAuthFetch(impl: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            usuario: { id: 9, nombre: 'Alu', correo: 'a@itsh.edu.mx', rol: 'usuario' },
          }),
        }
      }
      return impl(u, init)
    }),
  )
}

function conCliente(pagina: React.ReactNode, ruta = '/') {
  localStorage.setItem('itsh.token', 'tok')
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={pagina} />
            <Route path="/:id" element={pagina} />
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

describe('cliente rediseñado', () => {
  it('menú filtra por texto y categoría, con vacío de filtro', async () => {
    const user = userEvent.setup()
    mockAuthFetch((u) => {
      if (u.includes('/api/menu')) return { ok: true, json: async () => MENU }
      throw new Error(u)
    })
    conCliente(<Menu />)
    await screen.findByText('Gordita')
    await user.type(screen.getByLabelText(/buscar/i), 'zzz')
    expect(await screen.findByText(/sin resultados para ‘zzz’/i)).toBeInTheDocument()
    await user.clear(screen.getByLabelText(/buscar/i))
    await user.click(screen.getByRole('button', { name: 'Bebida' }))
    expect(screen.queryByText('Gordita')).not.toBeInTheDocument()
    expect(screen.getByText('Café')).toBeInTheDocument()
  })

  it('checkout muestra hora mínima y error inline', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'itsh.cart',
      JSON.stringify([{ menuDiaId: 11, nombre: 'Gordita', precio: 35, cantidad: 1 }]),
    )
    mockAuthFetch(() => {
      throw new Error('no debería llamar a la API')
    })
    localStorage.setItem('itsh.token', 'tok')
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Checkout />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByText(/hora mínima/i)).toBeInTheDocument()
    const pronto = new Date(Date.now() + 5 * 60_000)
    await user.clear(screen.getByLabelText(/hora de recogida/i))
    await user.type(screen.getByLabelText(/hora de recogida/i), pronto.toISOString().slice(0, 16))
    await user.click(screen.getByRole('button', { name: /confirmar y pagar/i }))
    expect(await screen.findByText(/al menos 10 minutos/)).toBeInTheDocument()
  })

  it('confirmación con folio grande y ambos CTAs', async () => {
    mockAuthFetch((u) => {
      if (u.includes('/api/pedidos/')) {
        return {
          ok: true,
          json: async () => ({
            pedido: {
              id: 7,
              numero: 'A-20261014-0007',
              estado: 'Pagado',
              total: '70.00',
              fechaRecoleccion: new Date().toISOString(),
              detalle: [],
              pagoReferencia: 'SIM-X',
            },
          }),
        }
      }
      throw new Error(u)
    })
    conCliente(<Confirmacion />, '/7')
    await waitFor(() => {
      expect(screen.getByText('A-20261014-0007')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /ver mis pedidos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al menú/i })).toBeInTheDocument()
  })

  it('mis pedidos con contador de activos y CTA nuevo pedido', async () => {
    mockAuthFetch((u) => {
      if (u.includes('/api/pedidos/mios')) {
        return {
          ok: true,
          json: async () => ({
            pedidos: [
              {
                id: 1,
                numero: 'A-1',
                tipo: 'anticipado',
                estado: 'Pagado',
                total: '10.00',
                fechaRecoleccion: null,
                detalle: [],
                pagoReferencia: null,
              },
              {
                id: 2,
                numero: 'A-2',
                tipo: 'anticipado',
                estado: 'Entregado',
                total: '10.00',
                fechaRecoleccion: null,
                detalle: [],
                pagoReferencia: null,
              },
            ],
          }),
        }
      }
      if (u.includes('/api/avisos')) return { ok: true, json: async () => ({ avisos: [] }) }
      throw new Error(u)
    })
    conCliente(<MisPedidos />)
    await waitFor(() => {
      expect(screen.getByText('A-1')).toBeInTheDocument()
    })
    expect(screen.getByText(/1 activo/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /nuevo pedido/i })).toBeInTheDocument()
  })
})
