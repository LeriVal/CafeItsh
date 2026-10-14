import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { AuthProvider } from '../src/lib/auth'
import { CartProvider } from '../src/lib/carrito'
import Caja from '../src/pages/caja/Caja'

const MENU = {
  fecha: '2026-10-14',
  lineas: [
    {
      id: 31,
      fecha: '2026-10-14',
      precio: '30.00',
      disponible: true,
      especial: false,
      platillo: { id: 1, nombre: 'Gordita', categoria: 'Comida', descripcion: 'Rica' },
    },
    {
      id: 32,
      fecha: '2026-10-14',
      precio: '20.00',
      disponible: true,
      especial: false,
      platillo: { id: 5, nombre: 'Café', categoria: 'Bebida', descripcion: '' },
    },
  ],
}

const LISTOS = [
  {
    id: 41,
    numero: 'A-20261014-0041',
    tipo: 'anticipado',
    estado: 'Listo',
    cliente: 'Luis',
    esperaMinutos: 20,
    creadoEn: new Date().toISOString(),
    total: '25.00',
    lineas: [],
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
            usuario: { id: 2, nombre: 'Caja', correo: 'c@itsh.edu.mx', rol: 'cajero' },
          }),
        }
      }
      return impl(u, init)
    }),
  )
}

function conCaja(ruta: string) {
  localStorage.setItem('itsh.token', 'tok')
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/caja/*" element={<Caja />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function mockBase() {
  mockFetch((u, init) => {
    if (u.includes('/api/menu')) return { ok: true, json: async () => MENU }
    if (u.includes('/api/caja/listos')) return { ok: true, json: async () => ({ pedidos: LISTOS }) }
    if (u.includes('/api/pedidos/mostrador')) {
      return {
        ok: true,
        json: async () => ({
          pedido: { id: 40, numero: 'M-20261014-0040', estado: 'Pagado', total: '60.00' },
          cambio: '40.00',
        }),
      }
    }
    if (u.includes('/estado')) return { ok: true, json: async () => ({ pedido: { id: 41 } }) }
    throw new Error(`${u} ${init?.method ?? ''}`)
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('caja rediseñada', () => {
  it('inicio con acciones y contador de entregas', async () => {
    mockBase()
    conCaja('/caja')
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /capturar pedido/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/1 por entregar/i)).toBeInTheDocument()
  })

  it('catálogo filtra por texto y categoría, stepper y flotante con total', async () => {
    const user = userEvent.setup()
    mockBase()
    conCaja('/caja/nuevo')
    await screen.findByText('Gordita')
    await user.type(screen.getByLabelText(/buscar/i), 'café')
    expect(screen.queryByText('Gordita')).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText(/buscar/i))
    await user.click(screen.getByRole('button', { name: 'Comida' }))
    expect(screen.queryByText('Café')).not.toBeInTheDocument()
    expect(screen.getByText('Gordita')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Agregar Gordita' }))
    await user.click(screen.getByRole('button', { name: 'Agregar uno más de Gordita' }))
    const barra = await screen.findByRole('link', { name: /ver cobro/i })
    expect(barra.textContent).toContain('60.00')
  })

  it('resumen desglosa y cobra en un paso con ticket', async () => {
    const user = userEvent.setup()
    mockBase()
    conCaja('/caja/nuevo')
    await screen.findByText('Gordita')
    await user.click(screen.getByRole('button', { name: 'Agregar Gordita' }))
    await user.click(screen.getByRole('link', { name: /ver cobro/i }))
    await waitFor(() => {
      expect(screen.getByText('Resumen de cobro')).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText(/monto recibido/i), '100')
    await user.click(screen.getByRole('button', { name: /registrar y cobrar/i }))
    await waitFor(() => {
      expect(screen.getByText('M-20261014-0040')).toBeInTheDocument()
    })
  })

  it('entregas listan con entregar y cancelar', async () => {
    const user = userEvent.setup()
    let patch = 0
    mockFetch((u: string) => {
      if (u.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({
            usuario: { id: 2, nombre: 'Caja', correo: 'c@itsh.edu.mx', rol: 'cajero' },
          }),
        }
      }
      if (u.includes('/api/caja/listos')) return { ok: true, json: async () => ({ pedidos: LISTOS }) }
      if (u.includes('/estado')) {
        patch += 1
        return { ok: true, json: async () => ({ pedido: { id: 41 } }) }
      }
      throw new Error(u)
    })
    localStorage.setItem('itsh.token', 'tok')
    render(
      <MemoryRouter initialEntries={['/caja/entregas']}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/caja/*" element={<Caja />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('A-20261014-0041')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Entregar' }))
    await waitFor(() => {
      expect(patch).toBe(1)
    })
  })
})
