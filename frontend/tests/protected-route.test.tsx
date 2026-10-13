import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { AuthProvider } from '../src/lib/auth'
import ProtectedRoute from '../src/components/ProtectedRoute'
import AccessDenied from '../src/pages/auth/AccessDenied'

function renderRuta(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>PÁGINA ENTRAR</p>} />
          <Route path="/sin-acceso" element={<AccessDenied />} />
          <Route
            path="/privada"
            element={
              <ProtectedRoute allowed={['cajero']}>
                <p>CONTENIDO PRIVADO</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('ProtectedRoute', () => {
  it('sin sesión redirige a /login', async () => {
    renderRuta('/privada')
    await waitFor(() => {
      expect(screen.getByText('PÁGINA ENTRAR')).toBeInTheDocument()
    })
    expect(screen.queryByText('CONTENIDO PRIVADO')).not.toBeInTheDocument()
  })

  it('con rol ajeno muestra denegación', async () => {
    localStorage.setItem('itsh.token', 'tok')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          usuario: { id: 1, nombre: 'Ana', correo: 'a@itsh.edu.mx', rol: 'usuario' },
        }),
      })),
    )
    renderRuta('/privada')
    await waitFor(() => {
      expect(screen.getByText(/no tienes acceso/i)).toBeInTheDocument()
    })
    expect(screen.queryByText('CONTENIDO PRIVADO')).not.toBeInTheDocument()
  })

  it('con el rol permitido muestra el contenido', async () => {
    localStorage.setItem('itsh.token', 'tok')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          usuario: { id: 2, nombre: 'Caja', correo: 'c@itsh.edu.mx', rol: 'cajero' },
        }),
      })),
    )
    renderRuta('/privada')
    await waitFor(() => {
      expect(screen.getByText('CONTENIDO PRIVADO')).toBeInTheDocument()
    })
  })
})
