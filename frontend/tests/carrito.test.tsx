import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { AuthProvider } from '../src/lib/auth'
import { CartProvider } from '../src/lib/carrito'
import Menu from '../src/pages/clientes/Menu'
import Checkout from '../src/pages/clientes/Checkout'
import Confirmacion from '../src/pages/clientes/Confirmacion'
const MENU = {
  fecha: '2026-10-13',
  lineas: [
    {
      id: 11,
      fecha: '2026-10-13',
      precio: '35.00',
      disponible: true,
      especial: false,
      platillo: { id: 1, nombre: 'Gordita', categoria: 'Comida', descripcion: 'Rica' },
    },
    {
      id: 12,
      fecha: '2026-10-13',
      precio: '20.00',
      disponible: false,
      especial: false,
      platillo: { id: 5, nombre: 'Café', categoria: 'Bebida', descripcion: 'Caliente' },
    },
  ],
}

const PEDIDO = {
  pedido: {
    id: 7,
    numero: 'A-20261013-0007',
    estado: 'Pendiente',
    total: '70.00',
    fechaRecoleccion: new Date(Date.now() + 3600_000).toISOString(),
    detalle: [
      { menuDiaId: 11, nombre: 'Gordita', cantidad: 2, precioUnitario: '35.00', subtotal: '70.00' },
    ],
    pagoReferencia: null,
  },
}

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
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

function conAuth(pagina: React.ReactNode, ruta = '/') {
  localStorage.setItem('itsh.token', 'tok')
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <CartProvider>{pagina}</CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('carrito en menú', () => {
  it('agregar suma al total informativo y lo no disponible no tiene control', async () => {
    const user = userEvent.setup()
    mockFetch((u) => {
      if (u.includes('/api/menu')) return { ok: true, json: async () => MENU }
      throw new Error(u)
    })
    conAuth(<Menu />)
    await waitFor(() => {
      expect(screen.getByText('Gordita')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Agregar Gordita' }))
    await user.click(screen.getByRole('button', { name: 'Agregar uno más de Gordita' }))
    expect(await screen.findByText((_, el) => el?.textContent === 'Revisar pedido · Total: $70.00')).toBeInTheDocument()
    const cafe = screen.getByText('Café').closest('article')
    expect(cafe?.querySelector('button')).toBeNull()
  })
})

describe('checkout', () => {
  it('exige recogida con al menos 10 minutos', async () => {
    const user = userEvent.setup()
    localStorage.setItem('itsh.token', 'tok')
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <CartProvider
            initialItems={[{ menuDiaId: 11, nombre: 'Gordita', precio: 35, cantidad: 1 }]}
          >
            <Routes>
              <Route path="/" element={<Checkout />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    const pronto = new Date(Date.now() + 5 * 60_000)
    const valor = pronto.toISOString().slice(0, 16)
    await user.clear(screen.getByLabelText(/hora de recogida/i))
    await user.type(screen.getByLabelText(/hora de recogida/i), valor)
    await user.click(screen.getByRole('button', { name: /confirmar y pagar/i }))
    expect(await screen.findByText(/al menos 10 minutos/)).toBeInTheDocument()
  })
})

describe('confirmación', () => {
  it('muestra folio, detalle, total y estado', async () => {
    mockFetch((u) => {
      if (u.includes('/api/pedidos/7')) {
        return {
          ok: true,
          json: async () => ({
            pedido: { ...PEDIDO.pedido, estado: 'Pagado', pagoReferencia: 'SIM-X' },
          }),
        }
      }
      throw new Error(u)
    })
    localStorage.setItem('itsh.token', 'tok')
    render(
      <MemoryRouter initialEntries={['/7']}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/:id" element={<Confirmacion />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(
        screen.getByText((_, el) => el?.textContent === 'Folio A-20261013-0007'),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Pagado')).toBeInTheDocument()
    expect(
      screen.getByText((_, el) => el?.textContent === 'Total pagado$70.00'),
    ).toBeInTheDocument()
  })
})
