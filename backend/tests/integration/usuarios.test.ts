import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { pool } from '../../src/db/pool.js'
import { hashPassword } from '../../src/services/auth.js'

let server: Server
let base = ''
const sufijo = Date.now()
const adminCorreo = `ops.admin.${sufijo}@itsh.edu.mx`
const clienteCorreo = `ops.cliente.${sufijo}@itsh.edu.mx`
const nuevoCorreo = `ops.cajero.${sufijo}@itsh.edu.mx`
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
     VALUES ('Ops', ?, ?, TRUE, (SELECT id FROM rol WHERE nombre = ?))`,
    [correo, hash, rol],
  )
}

async function login(correo: string): Promise<string> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password: 'Clave1234' }),
  })
  const body = (await res.json()) as { token: string }
  return body.token
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve())
  })
  base = `http://localhost:${(server.address() as AddressInfo).port}`
  await crearUsuario(adminCorreo, 'administrador')
  await crearUsuario(clienteCorreo, 'usuario')
  adminToken = await login(adminCorreo)
  clienteToken = await login(clienteCorreo)
})

afterAll(async () => {
  await pool.query('DELETE FROM usuario WHERE correo IN (?, ?, ?)', [
    adminCorreo,
    clienteCorreo,
    nuevoCorreo,
  ])
  await pool.end()
  server.close()
})

describe('GET /api/usuarios', () => {
  it('admin lista sin password_hash', async () => {
    const { status, body } = await api('/api/usuarios', adminToken)
    expect(status).toBe(200)
    const data = body as { usuarios: Array<Record<string, unknown>> }
    expect(data.usuarios.length).toBeGreaterThan(0)
    expect(JSON.stringify(body)).not.toContain('password_hash')
  })

  it('cliente recibe 403', async () => {
    const { status, body } = await api('/api/usuarios', clienteToken)
    expect(status).toBe(403)
    expect(body).toEqual({
      error: { code: 'FORBIDDEN', message: 'No tienes acceso a esta función' },
    })
  })

  it('sin token recibe 401', async () => {
    const { status } = await api('/api/usuarios')
    expect(status).toBe(401)
  })
})

describe('POST /api/usuarios', () => {
  it('admin crea cajero (201, sin hash)', async () => {
    const { status, body } = await api('/api/usuarios', adminToken, {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Cajero Nuevo',
        correo: nuevoCorreo,
        password: 'Clave1234',
        rol: 'cajero',
      }),
    })
    expect(status).toBe(201)
    const data = body as { usuario: { rol: string; correo: string } }
    expect(data.usuario.rol).toBe('cajero')
    expect(JSON.stringify(body)).not.toContain('password_hash')
  })

  it('el cajero creado inicia sesión', async () => {
    const token = await login(nuevoCorreo)
    expect(typeof token).toBe('string')
  })

  it('duplicado responde 409', async () => {
    const { status, body } = await api('/api/usuarios', adminToken, {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Otro',
        correo: nuevoCorreo,
        password: 'Clave1234',
        rol: 'cocinero',
      }),
    })
    expect(status).toBe(409)
    expect(body).toEqual({
      error: { code: 'EMAIL_TAKEN', message: 'Ese correo ya está registrado' },
    })
  })

  it('crear con rol administrador responde 400', async () => {
    const { status } = await api('/api/usuarios', adminToken, {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'X',
        correo: `ops.admin2.${sufijo}@itsh.edu.mx`,
        password: 'Clave1234',
        rol: 'administrador',
      }),
    })
    expect(status).toBe(400)
  })

  it('cliente no puede crear (403)', async () => {
    const { status } = await api('/api/usuarios', clienteToken, {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'X',
        correo: `ops.x.${sufijo}@itsh.edu.mx`,
        password: 'Clave1234',
        rol: 'cajero',
      }),
    })
    expect(status).toBe(403)
  })
})

describe('PATCH /api/usuarios/:id', () => {
  it('admin cambia rol cajero→cocinero y deshabilita; el operativo ya no accede', async () => {
    const lista = await api('/api/usuarios', adminToken)
    const usuarios = (lista.body as { usuarios: Array<{ id: number; correo: string }> }).usuarios
    const target = usuarios.find((u) => u.correo === nuevoCorreo)
    expect(target).toBeDefined()

    const cambio = await api(`/api/usuarios/${target?.id}`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ rol: 'cocinero' }),
    })
    expect(cambio.status).toBe(200)
    expect((cambio.body as { usuario: { rol: string } }).usuario.rol).toBe('cocinero')

    const baja = await api(`/api/usuarios/${target?.id}`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false }),
    })
    expect(baja.status).toBe(200)

    const intento = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: nuevoCorreo, password: 'Clave1234' }),
    })
    expect(intento.status).toBe(401)
  })

  it('inexistente responde 404', async () => {
    const { status } = await api('/api/usuarios/999999', adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ nombre: 'X' }),
    })
    expect(status).toBe(404)
  })

  it('el último administrador activo no puede deshabilitarse a sí mismo', async () => {
    // Deja un solo admin activo (el temporal) para probar la regla.
    await pool.query("UPDATE usuario SET activo = FALSE WHERE rol_id = (SELECT id FROM rol WHERE nombre = 'administrador') AND correo <> ?", [adminCorreo])
    try {
      const lista = await api('/api/usuarios', adminToken)
      const usuarios = (lista.body as { usuarios: Array<{ id: number; correo: string }> }).usuarios
      const yo = usuarios.find((u) => u.correo === adminCorreo)
      const { status, body } = await api(`/api/usuarios/${yo?.id}`, adminToken, {
        method: 'PATCH',
        body: JSON.stringify({ activo: false }),
      })
      expect(status).toBe(400)
      expect(body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No puedes deshabilitar al último administrador activo',
        },
      })
    } finally {
      await pool.query(
        "UPDATE usuario SET activo = TRUE WHERE rol_id = (SELECT id FROM rol WHERE nombre = 'administrador') AND correo LIKE 'admin@%'",
      )
    }
  })
})
