import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { AuthProvider } from '../src/lib/auth'
import { CartProvider } from '../src/lib/carrito'
import Caja from '../src/pages/caja/Caja'
import Cocina from '../src/pages/cocina/Cocina'

const COLA = [
  {
    id: 21,
    numero: 'A-20261013-0021',
    tipo: 'anticipado',
    estado: 'Pagado',
    cliente: 'Ana',
    esperaMinutos: 12,
    creadoEn: new Date().toISOString(),
    total: '70.00',
    lineas: [{ nombre: 'Gordita', cantidad: 2 }],
  },
  {
    id: 22,
    numero: 'M-20261013-0003',
    tipo: 'mostrador',
    estado: 'En preparación',
    cliente: 'Don Juan',
    esperaMinutos: 5,
    creadoEn: new Date().toISOString(),
    total: '35.00',
    lineas: [{ nombre: 'Café', cantidad: 1 }],
  },
]

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            usuario: { id: 3, nombre: 'Coci', correo: 'c@itsh.edu.mx', rol: 'cocinero' },
          }),
        }
      }
      return impl(u, init)
    }),
  )
}

function conRol(pagina: React.ReactNode) {
  localStorage.setItem('itsh.token', 'tok')
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>{pagina}</CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.useRealTimers()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('cocina', () => {
  it('muestra ambos orígenes con folio, espera y líneas; botones según estado', async () => {
    mockFetch((u) => {
      if (u.includes('/api/cocina/cola')) return { ok: true, json: async () => ({ pedidos: COLA }) }
      throw new Error(u)
    })
    conRol(<Cocina />)
    await waitFor(() => {
      expect(screen.getByText('A-20261013-0021')).toBeInTheDocument()
    })
    expect(screen.getByText('M-20261013-0003')).toBeInTheDocument()
    expect(screen.getByText(/12 min/)).toBeInTheDocument()
    const tarjeta = screen.getByText('A-20261013-0021').closest('article')
    expect(tarjeta).not.toBeNull()
    expect(within(tarjeta as HTMLElement).getByRole('button', { name: /iniciar preparación/i })).toBeInTheDocument()
    const tarjeta2 = screen.getByText('M-20261013-0003').closest('article')
    expect(
      within(tarjeta2 as HTMLElement).getByRole('button', { name: /marcar listo/i }),
    ).toBeInTheDocument()
  })

  it('avanzar estado refresca y hay sondeo programado', async () => {
    const user = userEvent.setup()
    const spyInterval = vi.spyOn(globalThis, 'setInterval')
    let llamadas = 0
    mockFetch((u, init) => {
      if (u.includes('/api/cocina/cola')) {
        llamadas += 1
        return { ok: true, json: async () => ({ pedidos: COLA }) }
      }
      if (u.includes('/estado') && init?.method === 'PATCH') {
        return { ok: true, json: async () => ({ pedido: { id: 21 } }) }
      }
      throw new Error(u)
    })
    conRol(<Cocina />)
    await waitFor(() => {
      expect(screen.getByText('A-20261013-0021')).toBeInTheDocument()
    })
    expect(llamadas).toBe(1)
    expect(spyInterval).toHaveBeenCalledWith(expect.any(Function), 10_000)
    const tarjeta = screen.getByText('A-20261013-0021').closest('article')
    await user.click(
      within(tarjeta as HTMLElement).getByRole('button', { name: /iniciar preparación/i }),
    )
    await waitFor(() => {
      expect(llamadas).toBe(2)
    })
    spyInterval.mockRestore()
  })
})

describe('caja', () => {
  it('captura con monto y muestra cambio; bloque de entrega lista Listo', async () => {
    const user = userEvent.setup()
    mockFetch((u, init) => {
      if (u.includes('/api/menu')) {
        return {
          ok: true,
          json: async () => ({
            fecha: '2026-10-13',
            lineas: [
              {
                id: 31,
                fecha: '2026-10-13',
                precio: '30.00',
                disponible: true,
                especial: false,
                platillo: { id: 2, nombre: 'Gordita', categoria: 'Comida', descripcion: '' },
              },
            ],
          }),
        }
      }
      if (u.includes('/api/pedidos/mostrador')) {
        return {
          ok: true,
          json: async () => ({
            pedido: { id: 40, numero: 'M-20261013-0040', estado: 'Pagado', total: '60.00' },
            cambio: '40.00',
          }),
        }
      }
      if (u.includes('/api/caja/listos')) {
        return {
          ok: true,
          json: async () => ({
            pedidos: [
              {
                id: 41,
                numero: 'A-20261013-0041',
                tipo: 'anticipado',
                estado: 'Listo',
                cliente: 'Luis',
                esperaMinutos: 20,
                creadoEn: new Date().toISOString(),
                total: '25.00',
                lineas: [],
              },
            ],
          }),
        }
      }
      if (u.includes('/estado')) {
        return { ok: true, json: async () => ({ pedido: { id: 41 } }) }
      }
      throw new Error(`${u} ${init?.method ?? ''}`)
    })
    conRol(<Caja />)
    await screen.findByRole('option', { name: /Gordita/ })
    await user.selectOptions(screen.getByLabelText('Platillo'), '31')
    await user.click(screen.getByRole('button', { name: 'Agregar' }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: (_, el) => el?.textContent === 'Cobrar $30.00' }),
      ).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText(/monto recibido/i), '100')
    await user.click(
      screen.getByRole('button', { name: (_, el) => el?.textContent === 'Cobrar $30.00' }),
    )
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
    expect(screen.getByRole('status').textContent).toContain('M-20261013-0040')
    expect(screen.getByRole('status').textContent).toContain('40.00')
    expect(screen.getByText('A-20261013-0041')).toBeInTheDocument()
  })
})
