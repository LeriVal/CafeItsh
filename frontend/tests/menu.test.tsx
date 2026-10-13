import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { AuthProvider } from '../src/lib/auth'
import Menu from '../src/pages/clientes/Menu'

const MENU = {
  fecha: '2026-10-13',
  lineas: [
    {
      id: 1,
      fecha: '2026-10-13',
      precio: '35.00',
      disponible: true,
      especial: true,
      platillo: { id: 1, nombre: 'Gordita', categoria: 'Comida', descripcion: 'Rica' },
    },
    {
      id: 2,
      fecha: '2026-10-13',
      precio: '20.00',
      disponible: false,
      especial: false,
      platillo: { id: 5, nombre: 'Café', categoria: 'Bebida', descripcion: 'Caliente' },
    },
  ],
}

function mockFetch(respuestas: Record<string, unknown>) {
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
      if (u.includes('/api/menu')) {
        return { ok: true, json: async () => respuestas.menu }
      }
      throw new Error(`fetch no simulado: ${u}`)
    }),
  )
}

function renderMenu() {
  localStorage.setItem('itsh.token', 'tok')
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Menu />
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('página de menú', () => {
  it('muestra carga y luego líneas con precio', async () => {
    mockFetch({ menu: MENU })
    renderMenu()
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Gordita')).toBeInTheDocument()
    })
    expect(screen.getByText(/\$35\.00/)).toBeInTheDocument()
  })

  it('destaca el especial del día', async () => {
    mockFetch({ menu: MENU })
    renderMenu()
    await waitFor(() => {
      expect(screen.getByText(/especial del día/i)).toBeInTheDocument()
    })
  })

  it('lo no disponible se identifica y no es seleccionable', async () => {
    mockFetch({ menu: MENU })
    renderMenu()
    await waitFor(() => {
      expect(screen.getByText('Café')).toBeInTheDocument()
    })
    expect(screen.getByText(/no disponible/i)).toBeInTheDocument()
    const cafe = screen.getByText('Café').closest('article')
    expect(cafe?.querySelector('button')).toBeNull()
  })

  it('día sin menú muestra mensaje claro', async () => {
    mockFetch({ menu: { fecha: '2026-10-13', lineas: [] } })
    renderMenu()
    await waitFor(() => {
      expect(screen.getByText(/aún no hay menú publicado/i)).toBeInTheDocument()
    })
  })
})
