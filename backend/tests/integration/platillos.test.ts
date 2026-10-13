import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { pool } from '../../src/db/pool.js'
import { hashPassword } from '../../src/services/auth.js'

let server: Server
let base = ''
const sufijo = Date.now()
const adminCorreo = `menu.admin.${sufijo}@itsh.edu.mx`
const clienteCorreo = `menu.cliente.${sufijo}@itsh.edu.mx`
let adminToken = ''
let clienteToken = ''

async function api(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  return { status: res.status, body: await res.json().catch(() => null) }
}

async function crearUsuario(correo: string, rol: string): Promise<void> {
  const hash = await hashPassword('Clave1234')
  await pool.query(
    `INSERT INTO usuario (nombre, correo, password_hash, activo, rol_id)
     VALUES ('Menu', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
    [correo, hash, rol],
  )
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve())
  })
  base = `http://localhost:${(server.address() as AddressInfo).port}`
  await crearUsuario(adminCorreo, 'administrador')
  await crearUsuario(clienteCorreo, 'usuario')
  for (const [correo, set] of [
    [adminCorreo, (t: string) => (adminToken = t)],
    [clienteCorreo, (t: string) => (clienteToken = t)],
  ] as const) {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password: 'Clave1234' }),
    })
    set(((await res.json()) as { token: string }).token)
  }
})

afterAll(async () => {
  await pool.query('DELETE FROM platillo WHERE nombre LIKE ?', [`Prueba % ${sufijo}`])
  await pool.query('DELETE FROM usuario WHERE correo IN (?, ?)', [adminCorreo, clienteCorreo])
  await pool.end()
  server.close()
})

describe('platillos', () => {
  it('admin crea 201', async () => {
    const { status, body } = await api('/api/platillos', adminToken, {
      method: 'POST',
      body: JSON.stringify({ nombre: `Prueba Taco ${sufijo}`, categoria: 'Comida', descripcion: 'Rico' }),
    })
    expect(status).toBe(201)
    const data = body as { platillo: { nombre: string; activo: boolean } }
    expect(data.platillo.nombre).toBe(`Prueba Taco ${sufijo}`)
    expect(data.platillo.activo).toBe(true)
  })

  it('editar 200 y desactivar excluye de ?activos=true', async () => {
    const creado = await api('/api/platillos', adminToken, {
      method: 'POST',
      body: JSON.stringify({ nombre: `Prueba Agua ${sufijo}` }),
    })
    const id = (creado.body as { platillo: { id: number } }).platillo.id
    const editado = await api(`/api/platillos/${id}`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ descripcion: 'Fresca', activo: false }),
    })
    expect(editado.status).toBe(200)
    const lista = await api('/api/platillos?activos=true', adminToken)
    const nombres = ((lista.body as { platillos: Array<{ nombre: string }> }).platillos).map((p) => p.nombre)
    expect(nombres).not.toContain(`Prueba Agua ${sufijo}`)
  })

  it('nombre vacío 400', async () => {
    const { status, body } = await api('/api/platillos', adminToken, {
      method: 'POST',
      body: JSON.stringify({ nombre: '  ' }),
    })
    expect(status).toBe(400)
    expect((body as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR')
  })

  it('cliente 403 y sin token 401', async () => {
    const comoCliente = await api('/api/platillos', clienteToken, {
      method: 'POST',
      body: JSON.stringify({ nombre: 'X' }),
    })
    expect(comoCliente.status).toBe(403)
    const sinToken = await api('/api/platillos')
    expect(sinToken.status).toBe(401)
  })

  it('inexistente 404', async () => {
    const { status } = await api('/api/platillos/999999', adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ nombre: 'X' }),
    })
    expect(status).toBe(404)
  })

  it('cualquier sesión puede listar', async () => {
    const { status, body } = await api('/api/platillos', clienteToken)
    expect(status).toBe(200)
    expect(Array.isArray((body as { platillos: unknown[] }).platillos)).toBe(true)
  })
})
